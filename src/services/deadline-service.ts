import { getDataStore } from "@/repositories";
import { DeadlinePreset } from "@/types";
import { getActivityService } from "./activity-service";
import crypto from "crypto";

export class DeadlineService {
  async getAll(): Promise<DeadlinePreset[]> {
    const store = getDataStore();
    return store.deadlines.getAll();
  }

  async getActive(): Promise<DeadlinePreset[]> {
    const deadlines = await this.getAll();
    return deadlines.filter((r) => r.active);
  }

  async getById(id: string): Promise<DeadlinePreset | null> {
    const store = getDataStore();
    return store.deadlines.getById(id);
  }

  async create(data: { name: string; sortOrder?: number }, actor: string): Promise<DeadlinePreset> {
    const store = getDataStore();
    const now = new Date().toISOString();
    const deadline: DeadlinePreset = {
      id: `d-${crypto.randomUUID().slice(0, 8)}`,
      name: data.name.trim(),
      active: true,
      sortOrder: data.sortOrder ?? 100,
      createdAt: now,
      updatedAt: now,
    };

    const created = await store.deadlines.create(deadline);
    await getActivityService().log(
      "DEADLINE_CREATED",
      created.id,
      actor,
      `Vytvořen termín: ${created.name}`
    );
    return created;
  }

  async update(
    id: string,
    data: { name?: string; active?: boolean; sortOrder?: number },
    actor: string
  ): Promise<DeadlinePreset> {
    const store = getDataStore();
    const existing = await store.deadlines.getById(id);
    if (!existing) {
      throw new Error(`Termín s ID ${id} nebyl nalezen.`);
    }

    const wasActive = existing.active;
    const now = new Date().toISOString();
    const updated: DeadlinePreset = {
      ...existing,
      name: data.name !== undefined ? data.name.trim() : existing.name,
      active: data.active !== undefined ? data.active : existing.active,
      sortOrder: data.sortOrder !== undefined ? data.sortOrder : existing.sortOrder,
      updatedAt: now,
    };

    const result = await store.deadlines.update(updated);

    if (wasActive && !updated.active) {
      await getActivityService().log(
        "DEADLINE_DEACTIVATED",
        id,
        actor,
        `Deaktivován termín: ${updated.name}`
      );
    } else if (!wasActive && updated.active) {
      await getActivityService().log(
        "DEADLINE_ACTIVATED",
        id,
        actor,
        `Aktivován termín: ${updated.name}`
      );
    } else {
      await getActivityService().log(
        "DEADLINE_UPDATED",
        id,
        actor,
        `Upraven termín: ${updated.name}`
      );
    }

    return result;
  }
}

let deadlineServiceInstance: DeadlineService | null = null;
export function getDeadlineService(): DeadlineService {
  if (!deadlineServiceInstance) {
    deadlineServiceInstance = new DeadlineService();
  }
  return deadlineServiceInstance;
}
