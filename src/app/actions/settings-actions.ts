"use server";

import { requireAdminSession } from "@/lib/auth/session";
import { personSchema, presetSchema, roomSchema } from "@/lib/validation/schemas";
import { getPeopleService } from "@/services/people-service";
import { getPresetService } from "@/services/preset-service";
import { getRoomService } from "@/services/room-service";
import { getDataStore } from "@/repositories";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function createPersonAction(data: z.infer<typeof personSchema>) {
  const session = await requireAdminSession();
  const actor = session.email;

  const parsed = personSchema.parse(data);
  const person = await getPeopleService().create(parsed, actor);

  revalidatePath("/settings");
  revalidatePath("/tasks/new");
  return { success: true, person };
}

export async function updatePersonAction(
  id: string,
  data: Partial<z.infer<typeof personSchema>>
) {
  const session = await requireAdminSession();
  const actor = session.email;

  const person = await getPeopleService().update(id, data, actor);

  revalidatePath("/settings");
  revalidatePath("/tasks/new");
  return { success: true, person };
}

export async function createPresetAction(data: z.infer<typeof presetSchema>) {
  const session = await requireAdminSession();
  const actor = session.email;

  const parsed = presetSchema.parse(data);
  const preset = await getPresetService().create(parsed, actor);

  revalidatePath("/settings");
  revalidatePath("/tasks/new");
  return { success: true, preset };
}

export async function updatePresetAction(
  id: string,
  data: Partial<z.infer<typeof presetSchema>>
) {
  const session = await requireAdminSession();
  const actor = session.email;

  const preset = await getPresetService().update(id, data, actor);

  revalidatePath("/settings");
  revalidatePath("/tasks/new");
  return { success: true, preset };
}

export async function createRoomAction(data: z.infer<typeof roomSchema>) {
  const session = await requireAdminSession();
  const actor = session.email;

  const parsed = roomSchema.parse(data);
  const room = await getRoomService().create(parsed, actor);

  revalidatePath("/settings");
  revalidatePath("/tasks/new");
  return { success: true, room };
}

export async function updateRoomAction(
  id: string,
  data: Partial<z.infer<typeof roomSchema>>
) {
  const session = await requireAdminSession();
  const actor = session.email;

  const room = await getRoomService().update(id, data, actor);

  revalidatePath("/settings");
  revalidatePath("/tasks/new");
  return { success: true, room };
}

export async function bootstrapStoreAction() {
  await requireAdminSession();
  const store = getDataStore();
  await store.initialize();
  revalidatePath("/settings");
  return { success: true, message: "Úložiště bylo úspěšně inicializováno." };
}
