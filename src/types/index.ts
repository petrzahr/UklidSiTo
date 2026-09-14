export type TaskStatus = "OPEN" | "DONE" | "CANCELLED";

export interface Task {
  id: string;
  taskPresetId?: string | null;
  taskName: string;
  roomId?: string | null;
  roomName?: string | null;
  assigneeId: string;
  assigneeName: string;
  assigneeEmail: string;
  note?: string | null;
  deadline?: string | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
  completionTokenHash: string;
  emailSentAt?: string | null;
}

export interface Person {
  id: string;
  name: string;
  email: string;
  emoji?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskPreset {
  id: string;
  name: string;
  category: "Kitchen" | "Cleaning" | "Bathroom" | "Waste" | "Laundry" | "General";
  icon?: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  name: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type ActivityEventType =
  | "TASK_CREATED"
  | "TASK_EDITED"
  | "TASK_CANCELLED"
  | "TASK_COMPLETED"
  | "EMAIL_SENT"
  | "EMAIL_RESENT"
  | "EMAIL_FAILED"
  | "ASSIGNEE_CHANGED"
  | "PERSON_CREATED"
  | "PERSON_UPDATED"
  | "PERSON_ACTIVATED"
  | "PERSON_DEACTIVATED"
  | "PRESET_CREATED"
  | "PRESET_UPDATED"
  | "PRESET_ACTIVATED"
  | "PRESET_DEACTIVATED"
  | "ROOM_CREATED"
  | "ROOM_UPDATED"
  | "ROOM_ACTIVATED"
  | "ROOM_DEACTIVATED";

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  eventType: ActivityEventType;
  entityId: string;
  actor: string;
  details?: string | null;
}

export interface CreateTaskInput {
  taskPresetId?: string | null;
  taskName: string;
  roomId?: string | null;
  roomName?: string | null;
  assigneeId: string;
  note?: string | null;
  deadline?: string | null;
  saveAsPreset?: boolean;
  saveAsRoomPreset?: boolean;
}

export interface EditTaskInput {
  id: string;
  taskName?: string;
  roomId?: string | null;
  roomName?: string | null;
  assigneeId?: string;
  note?: string | null;
  deadline?: string | null;
}
