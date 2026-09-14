"use server";

import { requireAdminSession } from "@/lib/auth/session";
import { createTaskSchema, editTaskSchema } from "@/lib/validation/schemas";
import { getTaskService } from "@/services/task-service";
import { CreateTaskInput, EditTaskInput } from "@/types";
import { revalidatePath } from "next/cache";

export async function createTaskAction(data: CreateTaskInput) {
  const session = await requireAdminSession();
  const actor = session.email;

  const parsed = createTaskSchema.parse(data);
  const taskService = getTaskService();
  const result = await taskService.createTask(parsed, actor);

  revalidatePath("/");
  revalidatePath("/settings");
  return { success: true, task: result.task, emailResult: result.emailResult };
}

export async function editTaskAction(data: EditTaskInput) {
  const session = await requireAdminSession();
  const actor = session.email;

  const parsed = editTaskSchema.parse(data);
  const taskService = getTaskService();
  const result = await taskService.editTask(parsed, actor);

  revalidatePath("/");
  revalidatePath(`/tasks/${parsed.id}/edit`);
  return { success: true, task: result.task, emailWarning: result.emailWarning };
}

export async function cancelTaskAction(id: string) {
  const session = await requireAdminSession();
  const actor = session.email;

  const taskService = getTaskService();
  const result = await taskService.cancelTask(id, actor);

  revalidatePath("/");
  return { success: true, task: result.task, emailWarning: result.emailWarning };
}

export async function resendTaskEmailAction(id: string) {
  const session = await requireAdminSession();
  const actor = session.email;

  const taskService = getTaskService();
  const result = await taskService.resendEmail(id, actor);

  revalidatePath("/");
  return { success: result.success, emailResult: result };
}
