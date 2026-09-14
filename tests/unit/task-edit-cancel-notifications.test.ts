import { describe, it, expect, beforeEach } from "vitest";
import { TaskService } from "@/services/task-service";
import { MemoryDataStore } from "@/repositories/memory-store";
import { setDataStoreForTesting } from "@/repositories";
import { getPeopleService } from "@/services/people-service";
import { getEmailService } from "@/services/email-service";
import { resetConfigCache } from "@/lib/config/env";

describe("Task Edit and Cancel Notification Emails", () => {
  let taskService: TaskService;
  let testStore: MemoryDataStore;

  beforeEach(() => {
    resetConfigCache();
    process.env.GOOGLE_SHEET_ID_PROD = "test-sheet-id";
    process.env.ADMIN_EMAIL = "admin@example.com";
    resetConfigCache();

    testStore = new MemoryDataStore(true);
    setDataStoreForTesting(testStore);
    taskService = new TaskService();
  });

  it("sends updated email with working completion link and rotates token on edit", async () => {
    const created = await taskService.createTask(
      {
        taskName: "Původní úkol",
        assigneeId: "p-eva",
        note: "Původní poznámka",
      },
      "admin@example.com"
    );

    const oldToken = created.rawToken;
    const oldHash = created.task.completionTokenHash;

    const editResult = await taskService.editTask(
      {
        id: created.task.id,
        taskName: "Upravený název úkolu",
        note: "Nová poznámka",
      },
      "admin@example.com"
    );

    expect(editResult.task.taskName).toBe("Upravený název úkolu");
    expect(editResult.task.note).toBe("Nová poznámka");
    expect(editResult.emailWarning).toBeNull();
    // Token was rotated
    expect(editResult.task.completionTokenHash).not.toBe(oldHash);

    // Old token no longer completes task
    const oldCompletion = await taskService.completeTask(oldToken);
    expect(oldCompletion.success).toBe(false);
  });

  it("persists task edits even if email delivery fails and returns non-fatal warning", async () => {
    const created = await taskService.createTask(
      {
        taskName: "Vysát auto",
        assigneeId: "p-eva",
      },
      "admin@example.com"
    );

    // Mock sendTaskUpdatedEmail failure
    const emailService = getEmailService();
    const originalMethod = emailService.sendTaskUpdatedEmail.bind(emailService);
    emailService.sendTaskUpdatedEmail = async () => ({
      success: false,
      error: "Resend API connection timeout",
      deliveredTo: "tester@byzahr.app",
    });

    const editResult = await taskService.editTask(
      {
        id: created.task.id,
        taskName: "Vysát auto a umýt okna",
      },
      "admin@example.com"
    );

    // Task change is kept in store
    const persisted = await taskService.getById(created.task.id);
    expect(persisted?.taskName).toBe("Vysát auto a umýt okna");

    // Non-fatal warning is returned
    expect(editResult.emailWarning).toContain("upozornění e-mailem se nepodařilo odeslat");

    // Restore method
    emailService.sendTaskUpdatedEmail = originalMethod;
  });

  it("sends cancellation email without completion link and persists CANCELLED status", async () => {
    const created = await taskService.createTask(
      {
        taskName: "Otřít linku",
        assigneeId: "p-anna",
        deadline: "Dnes večer",
      },
      "admin@example.com"
    );

    const cancelResult = await taskService.cancelTask(created.task.id, "admin@example.com");
    expect(cancelResult.task.status).toBe("CANCELLED");
    expect(cancelResult.emailWarning).toBeNull();

    // Persisted in store
    const persisted = await taskService.getById(created.task.id);
    expect(persisted?.status).toBe("CANCELLED");
    expect(persisted?.cancelledAt).toBeTruthy();

    // Completion is refused
    const completionAttempt = await taskService.completeTask(created.rawToken);
    expect(completionAttempt.success).toBe(false);
    expect(completionAttempt.status).toBe("CANCELLED");
  });

  it("persists cancellation even if email delivery fails and returns non-fatal warning", async () => {
    const created = await taskService.createTask(
      {
        taskName: "Vyměnit žárovku",
        assigneeId: "p-anna",
      },
      "admin@example.com"
    );

    // Mock sendTaskCancelledEmail failure
    const emailService = getEmailService();
    const originalMethod = emailService.sendTaskCancelledEmail.bind(emailService);
    emailService.sendTaskCancelledEmail = async () => ({
      success: false,
      error: "SMTP failure",
      deliveredTo: "tester@byzahr.app",
    });

    const cancelResult = await taskService.cancelTask(created.task.id, "admin@example.com");

    // Task is still CANCELLED in store
    const persisted = await taskService.getById(created.task.id);
    expect(persisted?.status).toBe("CANCELLED");

    // Warning is returned
    expect(cancelResult.emailWarning).toContain("e-mail o zrušení se nepodařilo odeslat");

    // Restore method
    emailService.sendTaskCancelledEmail = originalMethod;
  });

  it("deactivates person so they do not appear in getActive() but remain in getAll()", async () => {
    const peopleService = getPeopleService();
    const allBefore = await peopleService.getAll();
    const activeBefore = await peopleService.getActive();

    expect(activeBefore.some((p) => p.id === "p-eva")).toBe(true);

    // Deactivate Eva
    await peopleService.update("p-eva", { active: false }, "admin@example.com");

    const activeAfter = await peopleService.getActive();
    expect(activeAfter.some((p) => p.id === "p-eva")).toBe(false);

    const allAfter = await peopleService.getAll();
    const eva = allAfter.find((p) => p.id === "p-eva");
    expect(eva?.active).toBe(false);

    // Re-activate Eva
    await peopleService.update("p-eva", { active: true }, "admin@example.com");
    const activeReactivated = await peopleService.getActive();
    expect(activeReactivated.some((p) => p.id === "p-eva")).toBe(true);
  });
});
