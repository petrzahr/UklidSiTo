import {
  ActivityLogEntry,
  Person,
  Room,
  Task,
  TaskPreset,
} from "@/types";
import {
  IActivityRepository,
  IDataStore,
  IPeopleRepository,
  IPresetRepository,
  IRoomRepository,
  ITaskRepository,
} from "./interfaces";
import { INITIAL_PEOPLE, INITIAL_PRESETS, INITIAL_ROOMS } from "./seed-data";

export class MemoryDataStore implements IDataStore {
  private _tasks: Task[] = [];
  private _people: Person[] = [];
  private _presets: TaskPreset[] = [];
  private _rooms: Room[] = [];
  private _activity: ActivityLogEntry[] = [];
  private _initialized = false;

  constructor(seed = true) {
    if (seed) {
      const now = new Date().toISOString();
      this._people = INITIAL_PEOPLE.map((p) => ({ ...p, createdAt: now, updatedAt: now }));
      this._presets = INITIAL_PRESETS.map((p) => ({ ...p, createdAt: now, updatedAt: now }));
      this._rooms = INITIAL_ROOMS.map((r) => ({ ...r, createdAt: now, updatedAt: now }));
      this._initialized = true;
    }
  }

  async initialize(): Promise<void> {
    if (this._initialized) return;
    const now = new Date().toISOString();
    if (this._people.length === 0) {
      this._people = INITIAL_PEOPLE.map((p) => ({ ...p, createdAt: now, updatedAt: now }));
    }
    if (this._presets.length === 0) {
      this._presets = INITIAL_PRESETS.map((p) => ({ ...p, createdAt: now, updatedAt: now }));
    }
    if (this._rooms.length === 0) {
      this._rooms = INITIAL_ROOMS.map((r) => ({ ...r, createdAt: now, updatedAt: now }));
    }
    this._initialized = true;
  }

  tasks: ITaskRepository = {
    getAll: async () => [...this._tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    getById: async (id) => this._tasks.find((t) => t.id === id) || null,
    getByTokenHash: async (hash) =>
      this._tasks.find((t) => t.completionTokenHash === hash) || null,
    create: async (task) => {
      this._tasks.push({ ...task });
      return { ...task };
    },
    update: async (task) => {
      const idx = this._tasks.findIndex((t) => t.id === task.id);
      if (idx >= 0) {
        this._tasks[idx] = { ...task };
      } else {
        this._tasks.push({ ...task });
      }
      return { ...task };
    },
  };

  people: IPeopleRepository = {
    getAll: async () => [...this._people],
    getById: async (id) => this._people.find((p) => p.id === id) || null,
    create: async (person) => {
      this._people.push({ ...person });
      return { ...person };
    },
    update: async (person) => {
      const idx = this._people.findIndex((p) => p.id === person.id);
      if (idx >= 0) {
        this._people[idx] = { ...person };
      } else {
        this._people.push({ ...person });
      }
      return { ...person };
    },
  };

  presets: IPresetRepository = {
    getAll: async () => [...this._presets].sort((a, b) => a.sortOrder - b.sortOrder),
    getById: async (id) => this._presets.find((p) => p.id === id) || null,
    create: async (preset) => {
      this._presets.push({ ...preset });
      return { ...preset };
    },
    update: async (preset) => {
      const idx = this._presets.findIndex((p) => p.id === preset.id);
      if (idx >= 0) {
        this._presets[idx] = { ...preset };
      } else {
        this._presets.push({ ...preset });
      }
      return { ...preset };
    },
  };

  rooms: IRoomRepository = {
    getAll: async () => [...this._rooms].sort((a, b) => a.sortOrder - b.sortOrder),
    getById: async (id) => this._rooms.find((r) => r.id === id) || null,
    create: async (room) => {
      this._rooms.push({ ...room });
      return { ...room };
    },
    update: async (room) => {
      const idx = this._rooms.findIndex((r) => r.id === room.id);
      if (idx >= 0) {
        this._rooms[idx] = { ...room };
      } else {
        this._rooms.push({ ...room });
      }
      return { ...room };
    },
  };

  activity: IActivityRepository = {
    getAll: async (limit = 100) =>
      [...this._activity].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, limit),
    create: async (entry) => {
      this._activity.push({ ...entry });
      return { ...entry };
    },
  };
}
