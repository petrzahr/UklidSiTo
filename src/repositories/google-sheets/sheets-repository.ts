import { sheets_v4 } from "googleapis";
import {
  ActivityLogEntry,
  DeadlinePreset,
  Person,
  Room,
  Task,
  TaskPreset,
  TaskStatus,
} from "@/types";
import {
  IActivityRepository,
  IDataStore,
  IPeopleRepository,
  IPresetRepository,
  IRoomRepository,
  ITaskRepository,
} from "../interfaces";
import { getGoogleSheetsClient } from "./client";
import { INITIAL_PEOPLE, INITIAL_PRESETS, INITIAL_ROOMS, INITIAL_DEADLINES } from "../seed-data";

export const SHEET_NAMES = {
  TASKS: "Tasks",
  PEOPLE: "People",
  PRESETS: "TaskPresets",
  ROOMS: "Rooms",
  DEADLINES: "Deadlines",
  ACTIVITY: "ActivityLog",
} as const;

export const TASK_COLUMNS = [
  "id",
  "taskPresetId",
  "taskName",
  "roomId",
  "roomName",
  "assigneeId",
  "assigneeName",
  "assigneeEmail",
  "note",
  "deadline",
  "status",
  "createdAt",
  "updatedAt",
  "completedAt",
  "cancelledAt",
  "completionTokenHash",
  "emailSentAt",
];

export const PEOPLE_COLUMNS = [
  "id",
  "name",
  "email",
  "emoji",
  "active",
  "createdAt",
  "updatedAt",
];

export const PRESET_COLUMNS = [
  "id",
  "name",
  "category",
  "icon",
  "active",
  "sortOrder",
  "createdAt",
  "updatedAt",
];

export const ROOM_COLUMNS = [
  "id",
  "name",
  "active",
  "sortOrder",
  "createdAt",
  "updatedAt",
];

export const ACTIVITY_COLUMNS = [
  "id",
  "timestamp",
  "eventType",
  "entityId",
  "actor",
  "details",
];

export class GoogleSheetsDataStore implements IDataStore {
  private spreadsheetId: string;
  private client: sheets_v4.Sheets;

  constructor(spreadsheetId: string, client?: sheets_v4.Sheets) {
    this.spreadsheetId = spreadsheetId;
    this.client = client || getGoogleSheetsClient();
  }

  private deadlineSheetReady: Promise<void> | null = null;

  private ensureDeadlineSheet(): Promise<void> {
    if (!this.deadlineSheetReady) {
      this.deadlineSheetReady = this.initializeDeadlineSheet().catch((error) => {
        this.deadlineSheetReady = null;
        throw error;
      });
    }
    return this.deadlineSheetReady;
  }

  // Add only the new collection to existing installations; never rewrite existing data.
  private async initializeDeadlineSheet(): Promise<void> {
    const meta = await this.client.spreadsheets.get({ spreadsheetId: this.spreadsheetId });
    if (meta.data.sheets?.some((s) => s.properties?.title === SHEET_NAMES.DEADLINES)) return;
    const sheetId = Math.max(0, ...(meta.data.sheets || []).map((s) => s.properties?.sheetId || 0)) + 1;
    const now = new Date().toISOString();
    const rows = [ROOM_COLUMNS, ...INITIAL_DEADLINES.map((d) => [
      d.id, d.name, d.active ? "TRUE" : "FALSE", String(d.sortOrder), now, now,
    ])];
    try {
      // Sheets applies the creation and seed in one atomic batch.
      await this.client.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: { requests: [
          { addSheet: { properties: { title: SHEET_NAMES.DEADLINES, sheetId } } },
          { updateCells: {
            start: { sheetId, rowIndex: 0, columnIndex: 0 },
            rows: rows.map((row) => ({ values: row.map((value) => ({ userEnteredValue: { stringValue: value } })) })),
            fields: "userEnteredValue",
          } },
        ] },
      });
    } catch (error) {
      // Another request may have created the collection concurrently.
      const latest = await this.client.spreadsheets.get({ spreadsheetId: this.spreadsheetId });
      if (!latest.data.sheets?.some((s) => s.properties?.title === SHEET_NAMES.DEADLINES)) throw error;
    }
  }

  async initialize(): Promise<void> {
    await this.ensureDeadlineSheet();
    const meta = await this.client.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
    });

    const existingSheets = new Set(
      meta.data.sheets?.map((s) => s.properties?.title).filter(Boolean) || []
    );

    const requiredSheets = [
      { name: SHEET_NAMES.TASKS, cols: TASK_COLUMNS },
      { name: SHEET_NAMES.PEOPLE, cols: PEOPLE_COLUMNS },
      { name: SHEET_NAMES.PRESETS, cols: PRESET_COLUMNS },
      { name: SHEET_NAMES.ROOMS, cols: ROOM_COLUMNS },
      { name: SHEET_NAMES.ACTIVITY, cols: ACTIVITY_COLUMNS },
    ];

    const addSheetRequests = requiredSheets
      .filter((rs) => !existingSheets.has(rs.name))
      .map((rs) => ({
        addSheet: {
          properties: {
            title: rs.name,
          },
        },
      }));

    if (addSheetRequests.length > 0) {
      await this.client.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: addSheetRequests,
        },
      });
    }

    // Set headers and initial seed data if empty
    for (const rs of requiredSheets) {
      const res = await this.client.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${rs.name}!A1:Z1`,
      });

      const hasHeaders = (res.data.values && res.data.values.length > 0) || false;
      if (!hasHeaders) {
        await this.client.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${rs.name}!A1`,
          valueInputOption: "RAW",
          requestBody: {
            values: [rs.cols],
          },
        });
      }
    }

    // Seed people if empty
    const peopleRows = await this.client.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${SHEET_NAMES.PEOPLE}!A2:A`,
    });
    if (!peopleRows.data.values || peopleRows.data.values.length === 0) {
      const now = new Date().toISOString();
      const rows = INITIAL_PEOPLE.map((p) => [
        p.id,
        p.name,
        p.email,
        p.emoji || "",
        p.active ? "TRUE" : "FALSE",
        now,
        now,
      ]);
      await this.client.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEET_NAMES.PEOPLE}!A2`,
        valueInputOption: "RAW",
        requestBody: { values: rows },
      });
    }

    // Seed presets if empty
    const presetRows = await this.client.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${SHEET_NAMES.PRESETS}!A2:A`,
    });
    if (!presetRows.data.values || presetRows.data.values.length === 0) {
      const now = new Date().toISOString();
      const rows = INITIAL_PRESETS.map((p) => [
        p.id,
        p.name,
        p.category,
        p.icon || "",
        p.active ? "TRUE" : "FALSE",
        p.sortOrder,
        now,
        now,
      ]);
      await this.client.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEET_NAMES.PRESETS}!A2`,
        valueInputOption: "RAW",
        requestBody: { values: rows },
      });
    }

    // Seed rooms if empty
    const roomRows = await this.client.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${SHEET_NAMES.ROOMS}!A2:A`,
    });
    if (!roomRows.data.values || roomRows.data.values.length === 0) {
      const now = new Date().toISOString();
      const rows = INITIAL_ROOMS.map((r) => [
        r.id,
        r.name,
        r.active ? "TRUE" : "FALSE",
        r.sortOrder,
        now,
        now,
      ]);
      await this.client.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEET_NAMES.ROOMS}!A2`,
        valueInputOption: "RAW",
        requestBody: { values: rows },
      });
    }
  }

  tasks: ITaskRepository = {
    getAll: async () => {
      const res = await this.client.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEET_NAMES.TASKS}!A2:Q`,
      });
      const rows = res.data.values || [];
      return rows
        .map((row) => ({
          id: row[0] || "",
          taskPresetId: row[1] || null,
          taskName: row[2] || "",
          roomId: row[3] || null,
          roomName: row[4] || null,
          assigneeId: row[5] || "",
          assigneeName: row[6] || "",
          assigneeEmail: row[7] || "",
          note: row[8] || null,
          deadline: row[9] || null,
          status: (row[10] || "OPEN") as TaskStatus,
          createdAt: row[11] || "",
          updatedAt: row[12] || "",
          completedAt: row[13] || null,
          cancelledAt: row[14] || null,
          completionTokenHash: row[15] || "",
          emailSentAt: row[16] || null,
        }))
        .filter((t) => Boolean(t.id))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    getById: async (id: string) => {
      const tasks = await this.tasks.getAll();
      return tasks.find((t) => t.id === id) || null;
    },

    getByTokenHash: async (tokenHash: string) => {
      const tasks = await this.tasks.getAll();
      return tasks.find((t) => t.completionTokenHash === tokenHash) || null;
    },

    create: async (task: Task) => {
      const row = [
        task.id,
        task.taskPresetId || "",
        task.taskName,
        task.roomId || "",
        task.roomName || "",
        task.assigneeId,
        task.assigneeName,
        task.assigneeEmail,
        task.note || "",
        task.deadline || "",
        task.status,
        task.createdAt,
        task.updatedAt,
        task.completedAt || "",
        task.cancelledAt || "",
        task.completionTokenHash,
        task.emailSentAt || "",
      ];

      await this.client.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEET_NAMES.TASKS}!A2`,
        valueInputOption: "RAW",
        requestBody: {
          values: [row],
        },
      });

      return task;
    },

    update: async (task: Task) => {
      const res = await this.client.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEET_NAMES.TASKS}!A2:A`,
      });
      const rows = res.data.values || [];
      const rowIndex = rows.findIndex((r) => r[0] === task.id);
      if (rowIndex === -1) {
        throw new Error(`Task with id ${task.id} not found.`);
      }
      const sheetRowNumber = rowIndex + 2;

      const row = [
        task.id,
        task.taskPresetId || "",
        task.taskName,
        task.roomId || "",
        task.roomName || "",
        task.assigneeId,
        task.assigneeName,
        task.assigneeEmail,
        task.note || "",
        task.deadline || "",
        task.status,
        task.createdAt,
        task.updatedAt,
        task.completedAt || "",
        task.cancelledAt || "",
        task.completionTokenHash,
        task.emailSentAt || "",
      ];

      await this.client.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEET_NAMES.TASKS}!A${sheetRowNumber}:Q${sheetRowNumber}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [row],
        },
      });

      return task;
    },
  };

  people: IPeopleRepository = {
    getAll: async () => {
      const res = await this.client.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEET_NAMES.PEOPLE}!A2:G`,
      });
      const rows = res.data.values || [];
      return rows
        .map((r) => ({
          id: r[0] || "",
          name: r[1] || "",
          email: r[2] || "",
          emoji: r[3] || null,
          active: String(r[4]).toUpperCase() === "TRUE",
          createdAt: r[5] || "",
          updatedAt: r[6] || "",
        }))
        .filter((p) => Boolean(p.id));
    },

    getById: async (id: string) => {
      const people = await this.people.getAll();
      return people.find((p) => p.id === id) || null;
    },

    create: async (person: Person) => {
      const row = [
        person.id,
        person.name,
        person.email,
        person.emoji || "",
        person.active ? "TRUE" : "FALSE",
        person.createdAt,
        person.updatedAt,
      ];
      await this.client.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEET_NAMES.PEOPLE}!A2`,
        valueInputOption: "RAW",
        requestBody: { values: [row] },
      });
      return person;
    },

    update: async (person: Person) => {
      const res = await this.client.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEET_NAMES.PEOPLE}!A2:A`,
      });
      const rows = res.data.values || [];
      const rowIndex = rows.findIndex((r) => r[0] === person.id);
      if (rowIndex === -1) {
        throw new Error(`Person with id ${person.id} not found.`);
      }
      const sheetRowNumber = rowIndex + 2;

      const row = [
        person.id,
        person.name,
        person.email,
        person.emoji || "",
        person.active ? "TRUE" : "FALSE",
        person.createdAt,
        person.updatedAt,
      ];

      await this.client.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEET_NAMES.PEOPLE}!A${sheetRowNumber}:G${sheetRowNumber}`,
        valueInputOption: "RAW",
        requestBody: { values: [row] },
      });
      return person;
    },
  };

  presets: IPresetRepository = {
    getAll: async () => {
      const res = await this.client.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEET_NAMES.PRESETS}!A2:H`,
      });
      const rows = res.data.values || [];
      return rows
        .map((r) => ({
          id: r[0] || "",
          name: r[1] || "",
          category: (r[2] || "General") as TaskPreset["category"],
          icon: r[3] || null,
          active: String(r[4]).toUpperCase() === "TRUE",
          sortOrder: Number(r[5]) || 0,
          createdAt: r[6] || "",
          updatedAt: r[7] || "",
        }))
        .filter((p) => Boolean(p.id))
        .sort((a, b) => a.sortOrder - b.sortOrder);
    },

    getById: async (id: string) => {
      const presets = await this.presets.getAll();
      return presets.find((p) => p.id === id) || null;
    },

    create: async (preset: TaskPreset) => {
      const row = [
        preset.id,
        preset.name,
        preset.category,
        preset.icon || "",
        preset.active ? "TRUE" : "FALSE",
        preset.sortOrder,
        preset.createdAt,
        preset.updatedAt,
      ];
      await this.client.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEET_NAMES.PRESETS}!A2`,
        valueInputOption: "RAW",
        requestBody: { values: [row] },
      });
      return preset;
    },

    update: async (preset: TaskPreset) => {
      const res = await this.client.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEET_NAMES.PRESETS}!A2:A`,
      });
      const rows = res.data.values || [];
      const rowIndex = rows.findIndex((r) => r[0] === preset.id);
      if (rowIndex === -1) {
        throw new Error(`Preset with id ${preset.id} not found.`);
      }
      const sheetRowNumber = rowIndex + 2;

      const row = [
        preset.id,
        preset.name,
        preset.category,
        preset.icon || "",
        preset.active ? "TRUE" : "FALSE",
        preset.sortOrder,
        preset.createdAt,
        preset.updatedAt,
      ];

      await this.client.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEET_NAMES.PRESETS}!A${sheetRowNumber}:H${sheetRowNumber}`,
        valueInputOption: "RAW",
        requestBody: { values: [row] },
      });
      return preset;
    },
  };

  rooms: IRoomRepository = {
    getAll: async () => {
      const res = await this.client.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEET_NAMES.ROOMS}!A2:F`,
      });
      const rows = res.data.values || [];
      return rows
        .map((r) => ({
          id: r[0] || "",
          name: r[1] || "",
          active: String(r[2]).toUpperCase() === "TRUE",
          sortOrder: Number(r[3]) || 0,
          createdAt: r[4] || "",
          updatedAt: r[5] || "",
        }))
        .filter((r) => Boolean(r.id))
        .sort((a, b) => a.sortOrder - b.sortOrder);
    },

    getById: async (id: string) => {
      const rooms = await this.rooms.getAll();
      return rooms.find((r) => r.id === id) || null;
    },

    create: async (room: Room) => {
      const row = [
        room.id,
        room.name,
        room.active ? "TRUE" : "FALSE",
        room.sortOrder,
        room.createdAt,
        room.updatedAt,
      ];
      await this.client.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEET_NAMES.ROOMS}!A2`,
        valueInputOption: "RAW",
        requestBody: { values: [row] },
      });
      return room;
    },

    update: async (room: Room) => {
      const res = await this.client.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEET_NAMES.ROOMS}!A2:A`,
      });
      const rows = res.data.values || [];
      const rowIndex = rows.findIndex((r) => r[0] === room.id);
      if (rowIndex === -1) {
        throw new Error(`Room with id ${room.id} not found.`);
      }
      const sheetRowNumber = rowIndex + 2;

      const row = [
        room.id,
        room.name,
        room.active ? "TRUE" : "FALSE",
        room.sortOrder,
        room.createdAt,
        room.updatedAt,
      ];

      await this.client.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEET_NAMES.ROOMS}!A${sheetRowNumber}:F${sheetRowNumber}`,
        valueInputOption: "RAW",
        requestBody: { values: [row] },
      });
      return room;
    },
  };

  deadlines: IRoomRepository = {
    getAll: async () => {
      await this.ensureDeadlineSheet();
      const res = await this.client.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEET_NAMES.DEADLINES}!A2:F`,
      });
      const rows = res.data.values || [];
      return rows
        .map((r) => ({
          id: r[0] || "",
          name: r[1] || "",
          active: String(r[2]).toUpperCase() === "TRUE",
          sortOrder: Number(r[3]) || 0,
          createdAt: r[4] || "",
          updatedAt: r[5] || "",
        }))
        .filter((r) => Boolean(r.id))
        .sort((a, b) => a.sortOrder - b.sortOrder);
    },

    getById: async (id: string) => {
      const deadlines = await this.deadlines.getAll();
      return deadlines.find((r) => r.id === id) || null;
    },

    create: async (deadline: DeadlinePreset) => {
      await this.ensureDeadlineSheet();
      const row = [
        deadline.id,
        deadline.name,
        deadline.active ? "TRUE" : "FALSE",
        deadline.sortOrder,
        deadline.createdAt,
        deadline.updatedAt,
      ];
      await this.client.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEET_NAMES.DEADLINES}!A2`,
        valueInputOption: "RAW",
        requestBody: { values: [row] },
      });
      return deadline;
    },

    update: async (deadline: DeadlinePreset) => {
      await this.ensureDeadlineSheet();
      const res = await this.client.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEET_NAMES.DEADLINES}!A2:A`,
      });
      const rows = res.data.values || [];
      const rowIndex = rows.findIndex((r) => r[0] === deadline.id);
      if (rowIndex === -1) {
        throw new Error(`Deadline with id ${deadline.id} not found.`);
      }
      const sheetRowNumber = rowIndex + 2;

      const row = [
        deadline.id,
        deadline.name,
        deadline.active ? "TRUE" : "FALSE",
        deadline.sortOrder,
        deadline.createdAt,
        deadline.updatedAt,
      ];

      await this.client.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEET_NAMES.DEADLINES}!A${sheetRowNumber}:F${sheetRowNumber}`,
        valueInputOption: "RAW",
        requestBody: { values: [row] },
      });
      return deadline;
    },
  };

  activity: IActivityRepository = {
    getAll: async (limit = 100) => {
      const res = await this.client.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEET_NAMES.ACTIVITY}!A2:F`,
      });
      const rows = res.data.values || [];
      return rows
        .map((r) => ({
          id: r[0] || "",
          timestamp: r[1] || "",
          eventType: r[2] as ActivityLogEntry["eventType"],
          entityId: r[3] || "",
          actor: r[4] || "",
          details: r[5] || null,
        }))
        .filter((a) => Boolean(a.id))
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, limit);
    },

    create: async (entry: ActivityLogEntry) => {
      const row = [
        entry.id,
        entry.timestamp,
        entry.eventType,
        entry.entityId,
        entry.actor,
        entry.details || "",
      ];
      await this.client.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEET_NAMES.ACTIVITY}!A2`,
        valueInputOption: "RAW",
        requestBody: { values: [row] },
      });
      return entry;
    },
  };
}
