import { getDataStore } from "@/repositories";
import { Room } from "@/types";
import { getActivityService } from "./activity-service";
import crypto from "crypto";

export class RoomService {
  async getAll(): Promise<Room[]> {
    const store = getDataStore();
    return store.rooms.getAll();
  }

  async getActive(): Promise<Room[]> {
    const rooms = await this.getAll();
    return rooms.filter((r) => r.active);
  }

  async getById(id: string): Promise<Room | null> {
    const store = getDataStore();
    return store.rooms.getById(id);
  }

  async create(data: { name: string; sortOrder?: number }, actor: string): Promise<Room> {
    const store = getDataStore();
    const now = new Date().toISOString();
    const room: Room = {
      id: `r-${crypto.randomUUID().slice(0, 8)}`,
      name: data.name.trim(),
      active: true,
      sortOrder: data.sortOrder ?? 100,
      createdAt: now,
      updatedAt: now,
    };

    const created = await store.rooms.create(room);
    await getActivityService().log(
      "ROOM_CREATED",
      created.id,
      actor,
      `Vytvořena místnost: ${created.name}`
    );
    return created;
  }

  async update(
    id: string,
    data: { name?: string; active?: boolean; sortOrder?: number },
    actor: string
  ): Promise<Room> {
    const store = getDataStore();
    const existing = await store.rooms.getById(id);
    if (!existing) {
      throw new Error(`Místnost s ID ${id} nebyla nalezena.`);
    }

    const wasActive = existing.active;
    const now = new Date().toISOString();
    const updated: Room = {
      ...existing,
      name: data.name !== undefined ? data.name.trim() : existing.name,
      active: data.active !== undefined ? data.active : existing.active,
      sortOrder: data.sortOrder !== undefined ? data.sortOrder : existing.sortOrder,
      updatedAt: now,
    };

    const result = await store.rooms.update(updated);

    if (wasActive && !updated.active) {
      await getActivityService().log(
        "ROOM_DEACTIVATED",
        id,
        actor,
        `Deaktivována místnost: ${updated.name}`
      );
    } else if (!wasActive && updated.active) {
      await getActivityService().log(
        "ROOM_ACTIVATED",
        id,
        actor,
        `Aktivována místnost: ${updated.name}`
      );
    } else {
      await getActivityService().log(
        "ROOM_UPDATED",
        id,
        actor,
        `Upravena místnost: ${updated.name}`
      );
    }

    return result;
  }
}

let roomServiceInstance: RoomService | null = null;
export function getRoomService(): RoomService {
  if (!roomServiceInstance) {
    roomServiceInstance = new RoomService();
  }
  return roomServiceInstance;
}
