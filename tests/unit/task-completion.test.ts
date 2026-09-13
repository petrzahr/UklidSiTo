import { describe, it, expect, beforeEach } from "vitest";
import { TaskService } from "@/services/task-service";
import { MemoryDataStore } from "@/repositories/memory-store";
import { setDataStoreForTesting } from "@/repositories";

describe("Task Completion & Idempotency", () => {
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

  it("ensures GET /task/[token] lookup is strictly read-only", async () => {
    const created = await taskService.createTask(
      {
        taskName: "Vysát chodbu",
        assigneeId: "p-eva",
      },
      "admin@example.com"
    );

    const taskBefore = await taskService.getByToken(created.rawToken);
    expect(taskBefore?.status).toBe("OPEN");
    expect(taskBefore?.completedAt).toBeNull();

    // Call multiple times to verify no state change
    await taskService.getByToken(created.rawToken);
    await taskService.getByToken(created.rawToken);

    const taskAfter = await taskService.getById(created.task.id);
    expect(taskAfter?.status).toBe("OPEN");
    expect(taskAfter?.completedAt).toBeNull();
  });

  it("explicit completeTask marks task as DONE and records completedAt", async () => {
    const created = await taskService.createTask(
      {
        taskName: "Vynést odpad",
        assigneeId: "p-anna",
      },
      "admin@example.com"
    );

    const completeResult = await taskService.completeTask(created.rawToken);
    expect(completeResult.success).toBe(true);
    expect(completeResult.status).toBe("COMPLETED");

    const finished = await taskService.getById(created.task.id);
    expect(finished?.status).toBe("DONE");
    expect(finished?.completedAt).toBeTruthy();
  });

  it("is idempotent: re-completing an already DONE task does NOT alter completedAt", async () => {
    const created = await taskService.createTask(
      {
        taskName: "Otřít stůl",
        assigneeId: "p-eva",
      },
      "admin@example.com"
    );

    // 1st completion
    const res1 = await taskService.completeTask(created.rawToken);
    expect(res1.status).toBe("COMPLETED");
    const initialCompletedAt = res1.task.completedAt;

    // 2nd completion attempt
    const res2 = await taskService.completeTask(created.rawToken);
    expect(res2.success).toBe(true);
    expect(res2.status).toBe("ALREADY_DONE");
    expect(res2.task.completedAt).toBe(initialCompletedAt);
  });

  it("prevents completing a CANCELLED task", async () => {
    const created = await taskService.createTask(
      {
        taskName: "Zalít kytky",
        assigneeId: "p-anna",
      },
      "admin@example.com"
    );

    // Cancel task
    await taskService.cancelTask(created.task.id, "admin@example.com");

    // Attempt completion
    const res = await taskService.completeTask(created.rawToken);
    expect(res.success).toBe(false);
    expect(res.status).toBe("CANCELLED");
  });
});
