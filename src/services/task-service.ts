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
        `E-mail odeslán na ${emailResult.deliveredTo}`
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
   * Cancels an open task and dispatches a cancellation email to the assignee.
   * Preserves task cancellation even if email delivery fails.
   */
  async cancelTask(id: string, actor: string): Promise<{ task: Task; emailResult?: SendTaskEmailResult; emailWarning?: string | null }> {
    const store = getDataStore();
    const task = await store.tasks.getById(id);
    if (!task) {
      throw new Error(`Úkol s ID ${id} nebyl nalezen.`);
    }

    if (task.status === "CANCELLED") {
      return { task, emailWarning: null };
    }

    const wasOpen = task.status === "OPEN";
    const previousDeadline = task.deadline;
    const now = new Date().toISOString();

    task.status = "CANCELLED";
    task.cancelledAt = now;
    task.updatedAt = now;

    // 1. Persist cancellation FIRST
    await store.tasks.update(task);
    await getActivityService().log(
      "TASK_CANCELLED",
      task.id,
      actor,
      `Úkol "${task.taskName}" byl zrušen`
    );

    // 2. Dispatch cancellation email if task was OPEN
    if (wasOpen) {
      const emailResult = await getEmailService().sendTaskCancelledEmail(task, previousDeadline);
      if (emailResult.success) {
        await getActivityService().log(
          "EMAIL_SENT",
          task.id,
          actor,
          `E-mail o zrušení úkolu odeslán na ${emailResult.deliveredTo}`
        );
        return { task, emailResult, emailWarning: null };
      } else {
        await getActivityService().log(
          "EMAIL_FAILED",
          task.id,
          actor,
          `Odeslání e-mailu o zrušení selhalo: ${emailResult.error || "Neznámá chyba"}`
        );
        return {
          task,
          emailResult,
          emailWarning: `Úkol byl zrušen, ale e-mail o zrušení se nepodařilo odeslat (${emailResult.error || "chyba spojení"}).`,
        };
      }
    }

    return { task, emailWarning: null };
  }

  /**
   * Edits an existing task.
   * If task is OPEN, dispatches an updated notification email with a valid completion link.
   * If assignee changes, rotates token so the old assignee's link is revoked.
   * Preserves edits even if email delivery fails.
   */
  async editTask(input: EditTaskInput, actor: string): Promise<{ task: Task; emailResult?: SendTaskEmailResult; emailWarning?: string | null }> {
    const store = getDataStore();
    const task = await store.tasks.getById(input.id);
    if (!task) {
      throw new Error(`Úkol s ID ${input.id} nebyl nalezen.`);
    }

    const now = new Date().toISOString();
    let assigneeChanged = false;
    let oldAssigneeName = task.assigneeName;

    if (input.assigneeId && input.assigneeId !== task.assigneeId) {
      const newPerson = await getPeopleService().getById(input.assigneeId);
      if (!newPerson) {
        throw new Error(`Nový řešitel (ID: ${input.assigneeId}) nebyl nalezen.`);
      }

      assigneeChanged = true;
      task.assigneeId = newPerson.id;
      task.assigneeName = newPerson.name;
      task.assigneeEmail = newPerson.email;
    }

    // When task is OPEN, rotate token to supply a valid completion token in the updated email
    let rawToken: string | null = null;
    if (task.status === "OPEN") {
      rawToken = generateCompletionToken();
      task.completionTokenHash = hashCompletionToken(rawToken);
      if (assigneeChanged) {
        task.emailSentAt = null;
      }
    }

    if (input.taskName !== undefined) task.taskName = input.taskName.trim();
    if (input.roomId !== undefined) task.roomId = input.roomId || null;
    if (input.roomName !== undefined) task.roomName = input.roomName?.trim() || null;
    if (input.note !== undefined) task.note = input.note?.trim() || null;
    if (input.deadline !== undefined) task.deadline = input.deadline?.trim() || null;
    task.updatedAt = now;

    // 1. Persist changes FIRST
    await store.tasks.update(task);

    if (assigneeChanged) {
      await getActivityService().log(
        "ASSIGNEE_CHANGED",
        task.id,
        actor,
        `Úkol "${task.taskName}" přeřazen: z ${oldAssigneeName} na ${task.assigneeName}`
      );
    }

    await getActivityService().log(
      "TASK_EDITED",
      task.id,
      actor,
      `Upraven úkol "${task.taskName}"${assigneeChanged ? ` (nový řešitel: ${task.assigneeName})` : ""}`
    );

    // 2. Dispatch updated email if task is OPEN
    if (task.status === "OPEN" && rawToken) {
      const emailResult = await getEmailService().sendTaskUpdatedEmail(task, rawToken);
      if (emailResult.success) {
        task.emailSentAt = new Date().toISOString();
        await store.tasks.update(task);
        await getActivityService().log(
          "EMAIL_SENT",
          task.id,
          actor,
          `E-mail o úpravě úkolu odeslán na ${emailResult.deliveredTo}`
        );
        return { task, emailResult, emailWarning: null };
      } else {
        await getActivityService().log(
          "EMAIL_FAILED",
          task.id,
          actor,
          `Odeslání e-mailu o úpravě selhalo: ${emailResult.error || "Neznámá chyba"}`
        );
        return {
          task,
          emailResult,
          emailWarning: `Úkol byl upraven, ale upozornění e-mailem se nepodařilo odeslat (${emailResult.error || "chyba spojení"}).`,
        };
      }
    }

    return { task, emailWarning: null };
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
