import { ActivityLogEntry, Person, Room, Task, TaskPreset } from "@/types";

export interface ITaskRepository {
  getAll(): Promise<Task[]>;
  getById(id: string): Promise<Task | null>;
  getByTokenHash(tokenHash: string): Promise<Task | null>;
  create(task: Task): Promise<Task>;
  update(task: Task): Promise<Task>;
}

export interface IPeopleRepository {
  getAll(): Promise<Person[]>;
  getById(id: string): Promise<Person | null>;
  create(person: Person): Promise<Person>;
  update(person: Person): Promise<Person>;
}

export interface IPresetRepository {
  getAll(): Promise<TaskPreset[]>;
  getById(id: string): Promise<TaskPreset | null>;
  create(preset: TaskPreset): Promise<TaskPreset>;
  update(preset: TaskPreset): Promise<TaskPreset>;
}

export interface IRoomRepository {
  getAll(): Promise<Room[]>;
  getById(id: string): Promise<Room | null>;
  create(room: Room): Promise<Room>;
  update(room: Room): Promise<Room>;
}

export interface IActivityRepository {
  getAll(limit?: number): Promise<ActivityLogEntry[]>;
  create(entry: ActivityLogEntry): Promise<ActivityLogEntry>;
}

export interface IDataStore {
  tasks: ITaskRepository;
  people: IPeopleRepository;
  presets: IPresetRepository;
  rooms: IRoomRepository;
  activity: IActivityRepository;
  initialize(): Promise<void>;
}
