import { z } from "zod";

export const createTaskSchema = z.object({
  taskPresetId: z.string().nullable().optional(),
  taskName: z.string().trim().min(1, "Název úkolu je povinný").max(120),
  roomId: z.string().nullable().optional(),
  roomName: z.string().trim().max(80).nullable().optional(),
  assigneeId: z.string().trim().min(1, "Vyberte, kdo úkol schytá"),
  note: z.string().trim().max(500).nullable().optional(),
  deadline: z.string().trim().max(100).nullable().optional(),
  saveAsPreset: z.boolean().optional(),
  saveAsRoomPreset: z.boolean().optional(),
});

export const editTaskSchema = z.object({
  id: z.string().min(1),
  taskName: z.string().trim().min(1, "Název úkolu je povinný").max(120).optional(),
  roomId: z.string().nullable().optional(),
  roomName: z.string().trim().max(80).nullable().optional(),
  assigneeId: z.string().min(1).optional(),
  note: z.string().trim().max(500).nullable().optional(),
  deadline: z.string().trim().max(100).nullable().optional(),
});

export const personSchema = z.object({
  name: z.string().trim().min(1, "Jméno je povinné").max(60),
  email: z.string().trim().email("Neplatná e-mailová adresa").toLowerCase(),
  emoji: z.string().trim().max(10).optional(),
  active: z.boolean().default(true),
});

export const presetSchema = z.object({
  name: z.string().trim().min(1, "Název předvolby je povinný").max(100),
  category: z.enum(["Kitchen", "Cleaning", "Bathroom", "Waste", "Laundry", "General"]),
  icon: z.string().trim().max(10).optional(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const roomSchema = z.object({
  name: z.string().trim().min(1, "Název místnosti je povinný").max(80),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});
