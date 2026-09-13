import { getDataStore } from "@/repositories";
import { ActivityEventType, ActivityLogEntry } from "@/types";
import crypto from "crypto";

export class ActivityService {
  async log(
    eventType: ActivityEventType,
    entityId: string,
    actor: string,
    details?: string | null
  ): Promise<ActivityLogEntry> {
    const store = getDataStore();
    const entry: ActivityLogEntry = {
      id: `act-${crypto.randomUUID()}`,
      timestamp: new Date().toISOString(),
      eventType,
      entityId,
      actor,
      details: details || null,
    };
    return store.activity.create(entry);
  }

  async getRecent(limit = 50): Promise<ActivityLogEntry[]> {
    const store = getDataStore();
    return store.activity.getAll(limit);
  }
}

let activityServiceInstance: ActivityService | null = null;
export function getActivityService(): ActivityService {
  if (!activityServiceInstance) {
    activityServiceInstance = new ActivityService();
  }
  return activityServiceInstance;
}
