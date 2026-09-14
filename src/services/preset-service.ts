import { getDataStore } from "@/repositories";
import { TaskPreset } from "@/types";
import { getActivityService } from "./activity-service";
import crypto from "crypto";

export class PresetService {
  async getAll(): Promise<TaskPreset[]> {
    const store = getDataStore();
    return store.presets.getAll();
  }

  async getActive(): Promise<TaskPreset[]> {
    const presets = await this.getAll();
    return presets.filter((p) => p.active);
  }

  async getById(id: string): Promise<TaskPreset | null> {
    const store = getDataStore();
    return store.presets.getById(id);
  }

  async create(
    data: {
      name: string;
      category: TaskPreset["category"];
      icon?: string | null;
      sortOrder?: number;
    },
    actor: string
  ): Promise<TaskPreset> {
    const store = getDataStore();
    const now = new Date().toISOString();
    const preset: TaskPreset = {
      id: `tp-${crypto.randomUUID().slice(0, 8)}`,
      name: data.name.trim(),
      category: data.category,
      icon: data.icon?.trim() || null,
      active: true,
      sortOrder: data.sortOrder ?? 100,
      createdAt: now,
      updatedAt: now,
    };

    const created = await store.presets.create(preset);
    await getActivityService().log(
      "PRESET_CREATED",
      created.id,
      actor,
      `Vytvořena předvolba: ${created.name} (${created.category})`
    );
    return created;
  }

  async update(
    id: string,
    data: {
      name?: string;
      category?: TaskPreset["category"];
      icon?: string | null;
      active?: boolean;
      sortOrder?: number;
    },
    actor: string
  ): Promise<TaskPreset> {
    const store = getDataStore();
    const existing = await store.presets.getById(id);
    if (!existing) {
      throw new Error(`Předvolba s ID ${id} nebyla nalezena.`);
    }

    const wasActive = existing.active;
    const now = new Date().toISOString();
    const updated: TaskPreset = {
      ...existing,
      name: data.name !== undefined ? data.name.trim() : existing.name,
      category: data.category !== undefined ? data.category : existing.category,
      icon: data.icon !== undefined ? data.icon?.trim() || null : existing.icon,
      active: data.active !== undefined ? data.active : existing.active,
      sortOrder: data.sortOrder !== undefined ? data.sortOrder : existing.sortOrder,
      updatedAt: now,
    };

    const result = await store.presets.update(updated);

    if (wasActive && !updated.active) {
      await getActivityService().log(
        "PRESET_DEACTIVATED",
        id,
        actor,
        `Deaktivována předvolba: ${updated.name}`
      );
    } else if (!wasActive && updated.active) {
      await getActivityService().log(
        "PRESET_ACTIVATED",
        id,
        actor,
        `Aktivována předvolba: ${updated.name}`
      );
    } else {
      await getActivityService().log(
        "PRESET_UPDATED",
        id,
        actor,
        `Upravena předvolba: ${updated.name}`
      );
    }

    return result;
  }
}

let presetServiceInstance: PresetService | null = null;
export function getPresetService(): PresetService {
  if (!presetServiceInstance) {
    presetServiceInstance = new PresetService();
  }
  return presetServiceInstance;
}
