import { getDataStore } from "@/repositories";
import { Person } from "@/types";
import { getActivityService } from "./activity-service";
import crypto from "crypto";

export class PeopleService {
  async getAll(): Promise<Person[]> {
    const store = getDataStore();
    return store.people.getAll();
  }

  async getActive(): Promise<Person[]> {
    const people = await this.getAll();
    return people.filter((p) => p.active);
  }

  async getById(id: string): Promise<Person | null> {
    const store = getDataStore();
    return store.people.getById(id);
  }

  async create(
    data: { name: string; email: string; emoji?: string | null },
    actor: string
  ): Promise<Person> {
    const store = getDataStore();
    const now = new Date().toISOString();
    const person: Person = {
      id: `p-${crypto.randomUUID().slice(0, 8)}`,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      emoji: data.emoji?.trim() || null,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    const created = await store.people.create(person);
    await getActivityService().log(
      "PERSON_CREATED",
      created.id,
      actor,
      `Přidán člen: ${created.name} (${created.email})`
    );
    return created;
  }

  async update(
    id: string,
    data: { name?: string; email?: string; emoji?: string | null; active?: boolean },
    actor: string
  ): Promise<Person> {
    const store = getDataStore();
    const existing = await store.people.getById(id);
    if (!existing) {
      throw new Error(`Člen s ID ${id} nebyl nalezen.`);
    }

    const wasActive = existing.active;
    const now = new Date().toISOString();
    const updated: Person = {
      ...existing,
      name: data.name !== undefined ? data.name.trim() : existing.name,
      email: data.email !== undefined ? data.email.trim().toLowerCase() : existing.email,
      emoji: data.emoji !== undefined ? data.emoji?.trim() || null : existing.emoji,
      active: data.active !== undefined ? data.active : existing.active,
      updatedAt: now,
    };

    const result = await store.people.update(updated);

    if (wasActive && !updated.active) {
      await getActivityService().log(
        "PERSON_DEACTIVATED",
        id,
        actor,
        `Deaktivován člen: ${updated.name}`
      );
    } else {
      await getActivityService().log(
        "PERSON_UPDATED",
        id,
        actor,
        `Upraven člen: ${updated.name}`
      );
    }

    return result;
  }
}

let peopleServiceInstance: PeopleService | null = null;
export function getPeopleService(): PeopleService {
  if (!peopleServiceInstance) {
    peopleServiceInstance = new PeopleService();
  }
  return peopleServiceInstance;
}
