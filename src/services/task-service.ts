import { getDataStore } from "@/repositories";
import { CreateTaskInput, EditTaskInput, Task } from "@/types";
import { generateCompletionToken, hashCompletionToken } from "@/lib/security/token";
import { getActivityService } from "./activity-service";
import { getEmailService, SendTaskEmailResult } from "./email-service";
import { getPeopleService } from "./people-service";
import { getPresetService } from "./preset-service";
import { getRoomService } from "./room-service";
import crypto from "crypto";

export interface CreateTaskResult {
  task: Task;
  rawToken: string;
  emailResult: SendTaskEmailResult;
}

export type CompleteTaskResult =
  | { success: true; status: "COMPLETED" | "ALREADY_DONE"; task: Task }
  | { success: false; status: "NOT_FOUND" | "CANCELLED"; task?: Task };

export class TaskService {
  async getAll(): Promise<Task[]> {
    const store = getDataStore();
    return store.tasks.getAll();
  }

  async getById(id: string): Promise<Task | null> {
    const store = getDataStore();
    return store.tasks.getById(id);
  }

  /**
   * Strictly read-only task lookup by raw token.
   * Never mutates task state.
   */
  async getByToken(token: string): Promise<Task | null> {
    if (!token) return null;
    const hash = hashCompletionToken(token);
    const store = getDataStore();
    return store.tasks.getByTokenHash(hash);
  }

  /**
   * Creates a new household task, records snapshot values,
   * generates a secure completion token, stores its hash,
   * and dispatches the notification email.
   */
  async createTask(input: CreateTaskInput, actor: string): Promise<CreateTaskResult> {
    const store = getDataStore();
    const peopleService = getPeopleService();
    const assignee = await peopleService.getById(input.assigneeId);

    if (!assignee) {
      throw new Error(`Vybraný člen (ID: ${input.assigneeId}) neexistuje.`);
    }

    // Optional: save custom task as preset if requested
    if (input.saveAsPreset && !input.taskPresetId) {
      try {
        await getPresetService().create(
          {
            name: input.taskName,
            category: "General",
            icon: "✨",
          },
          actor
        );
      } catch (e) {
        console.warn("[Preset Auto-save]", e);
      }
    }

    // Optional: save custom room as room preset if requested
    if (input.saveAsRoomPreset && input.roomName && !input.roomId) {
      try {
        await getRoomService().create({ name: input.roomName }, actor);
      } catch (e) {
        console.warn("[Room Auto-save]", e);
      }
    }

    const rawToken = generateCompletionToken();
    const tokenHash = hashCompletionToken(rawToken);
    const now = new Date().toISOString();

    const task: Task = {
      id: `task-${crypto.randomUUID()}`,
      taskPresetId: input.taskPresetId || null,
      taskName: input.taskName.trim(),
      roomId: input.roomId || null,
      roomName: input.roomName?.trim() || null,
      assigneeId: assignee.id,
      assigneeName: assignee.name,
      assigneeEmail: assignee.email,
      note: input.note?.trim() || null,
      deadline: input.deadline?.trim() || null,
      status: "OPEN",
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      cancelledAt: null,
      completionTokenHash: tokenHash,
      emailSentAt: null,
    };

    // 1. Persist task to Google Sheets / store
    await store.tasks.create(task);
    await getActivityService().log(
      "TASK_CREATED",
      task.id,
      actor,
      `Zadán úkol "${task.taskName}" pro ${task.assigneeName}`
    );

    // 2. Dispatch notification email
    const emailResult = await getEmailService().sendTaskEmail(task, rawToken);

    if (emailResult.success) {
      task.emailSentAt = new Date().toISOString();
      await store.tasks.update(task);
      await getActivityService().log(
        "EMAIL_SENT",
        task.id,
        actor,
        `E-mail odeslán na ${emailResult.deliveredTo}${emailResult.isTestRedirected ? " (test přesměrování)" : ""}`
      );
    } else {
      console.error(
        `[Task Service] Email delivery failed for task ${task.id}: ${emailResult.error}`
      );
    }

    return { task, rawToken, emailResult };
  }

  /**
   * Explicitly completes a task.
   * Validates token hash, enforces idempotency, prevents completing cancelled tasks.
   */
  async completeTask(token: string, actor = "Household Member"): Promise<CompleteTaskResult> {
    if (!token) {
      return { success: false, status: "NOT_FOUND" };
    }

    const hash = hashCompletionToken(token);
    const store = getDataStore();
    const task = await store.tasks.getByTokenHash(hash);

    if (!task) {
      return { success: false, status: "NOT_FOUND" };
    }

    if (task.status === "CANCELLED") {
      return { success: false, status: "CANCELLED", task };
    }

    // Idempotency: If already completed, do NOT update timestamp
    if (task.status === "DONE") {
      return { success: true, status: "ALREADY_DONE", task };
    }

    const now = new Date().toISOString();
    task.status = "DONE";
    task.completedAt = now;
    task.updatedAt = now;

    await store.tasks.update(task);
    await getActivityService().log(
      "TASK_COMPLETED",
      task.id,
      actor,
      `Úkol "${task.taskName}" byl úspěšně splněn (${task.assigneeName})`
    );

    return { success: true, status: "COMPLETED", task };
  }

  /**
   * Cancels an open task.
   */
  async cancelTask(id: string, actor: string): Promise<Task> {
    const store = getDataStore();
    const task = await store.tasks.getById(id);
    if (!task) {
      throw new Error(`Úkol s ID ${id} nebyl nalezen.`);
    }

    const now = new Date().toISOString();
    task.status = "CANCELLED";
    task.cancelledAt = now;
    task.updatedAt = now;

    await store.tasks.update(task);
    await getActivityService().log(
      "TASK_CANCELLED",
      task.id,
      actor,
      `Úkol "${task.taskName}" byl zrušen`
    );

    return task;
  }

  /**
   * Edits task. If assignee changes, rotates completion token and sends new email.
   */
  async editTask(input: EditTaskInput, actor: string): Promise<Task> {
    const store = getDataStore();
    const task = await store.tasks.getById(input.id);
    if (!task) {
      throw new Error(`Úkol s ID ${input.id} nebyl nalezen.`);
    }

    const now = new Date().toISOString();
    let assigneeChanged = false;
    let newRawToken: string | null = null;

    if (input.assigneeId && input.assigneeId !== task.assigneeId) {
      const newPerson = await getPeopleService().getById(input.assigneeId);
      if (!newPerson) {
        throw new Error(`Nový řešitel (ID: ${input.assigneeId}) nebyl nalezen.`);
      }

      assigneeChanged = true;
      task.assigneeId = newPerson.id;
      task.assigneeName = newPerson.name;
      task.assigneeEmail = newPerson.email;

      // Token rotation: invalidate previous token by issuing a fresh one
      newRawToken = generateCompletionToken();
      task.completionTokenHash = hashCompletionToken(newRawToken);
      task.emailSentAt = null;
    }

    if (input.taskName !== undefined) task.taskName = input.taskName.trim();
    if (input.roomId !== undefined) task.roomId = input.roomId || null;
    if (input.roomName !== undefined) task.roomName = input.roomName?.trim() || null;
    if (input.note !== undefined) task.note = input.note?.trim() || null;
    if (input.deadline !== undefined) task.deadline = input.deadline?.trim() || null;
    task.updatedAt = now;

    await store.tasks.update(task);
    await getActivityService().log(
      "TASK_EDITED",
      task.id,
      actor,
      `Upraven úkol "${task.taskName}"${assigneeChanged ? ` (předáno: ${task.assigneeName})` : ""}`
    );

    // Send email to new assignee if rotated
    if (assigneeChanged && newRawToken) {
      const emailResult = await getEmailService().sendTaskEmail(task, newRawToken);
      if (emailResult.success) {
        task.emailSentAt = new Date().toISOString();
        await store.tasks.update(task);
        await getActivityService().log(
          "EMAIL_SENT",
          task.id,
          actor,
          `Nový e-mail odeslán na ${emailResult.deliveredTo}`
        );
      }
    }

    return task;
  }

  /**
   * Resends notification email with rotated token.
   */
  async resendEmail(id: string, actor: string): Promise<SendTaskEmailResult> {
    const store = getDataStore();
    const task = await store.tasks.getById(id);
    if (!task) {
      throw new Error(`Úkol s ID ${id} nebyl nalezen.`);
    }

    // Securely rotate token to prevent reuse of leaked links
    const newRawToken = generateCompletionToken();
    task.completionTokenHash = hashCompletionToken(newRawToken);
    task.updatedAt = new Date().toISOString();

    const emailResult = await getEmailService().sendTaskEmail(task, newRawToken);
    if (emailResult.success) {
      task.emailSentAt = new Date().toISOString();
      await store.tasks.update(task);
      await getActivityService().log(
        "EMAIL_RESENT",
        task.id,
        actor,
        `E-mail znovu odeslán na ${emailResult.deliveredTo}`
      );
    }

    return emailResult;
  }
}

let taskServiceInstance: TaskService | null = null;
export function getTaskService(): TaskService {
  if (!taskServiceInstance) {
    taskServiceInstance = new TaskService();
  }
  return taskServiceInstance;
}
