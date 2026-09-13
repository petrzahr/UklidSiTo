import { describe, it, expect, beforeEach } from "vitest";
import { TaskService } from "@/services/task-service";
import { MemoryDataStore } from "@/repositories/memory-store";
import { setDataStoreForTesting } from "@/repositories";

describe("Task Reassignment & Token Rotation", () => {
  let taskService: TaskService;
  let testStore: MemoryDataStore;

  beforeEach(() => {
    process.env.APP_ENV = "development";
    process.env.GOOGLE_SHEET_ID_TEST = "test-sheet-id";
    process.env.ADMIN_EMAIL = "admin@example.com";

    testStore = new MemoryDataStore(true);
    setDataStoreForTesting(testStore);
    taskService = new TaskService();
  });

  it("rotates completion token when assignee changes, invalidating the old token", async () => {
    // 1. Assign to Eva
    const created = await taskService.createTask(
      {
        taskName: "Umýt nádobí",
        assigneeId: "p-eva",
      },
      "admin@example.com"
    );

    const oldToken = created.rawToken;
    const oldHash = created.task.completionTokenHash;

    // Verify old token works before reassignment
    const foundWithOldToken = await taskService.getByToken(oldToken);
    expect(foundWithOldToken?.id).toBe(created.task.id);

    // 2. Reassign to Anna
    await taskService.editTask(
      {
        id: created.task.id,
        assigneeId: "p-anna",
      },
      "admin@example.com"
    );

    const updatedTask = await taskService.getById(created.task.id);
    expect(updatedTask?.assigneeId).toBe("p-anna");
    expect(updatedTask?.assigneeName).toBe("Anna");
    expect(updatedTask?.completionTokenHash).not.toBe(oldHash);

    // 3. Old token should now be INVALID
    const foundWithOldTokenAfter = await taskService.getByToken(oldToken);
    expect(foundWithOldTokenAfter).toBeNull();

    const completionWithOld = await taskService.completeTask(oldToken);
    expect(completionWithOld.success).toBe(false);
    expect(completionWithOld.status).toBe("NOT_FOUND");
  });
});
