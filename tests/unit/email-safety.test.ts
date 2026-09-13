import { describe, it, expect, beforeEach } from "vitest";
import { EmailService } from "@/services/email-service";
import { Task } from "@/types";
import { resetConfigCache } from "@/lib/config/env";

describe("Email Safety Layer", () => {
  const dummyTask: Task = {
    id: "task-1",
    taskName: "Vysát obývák",
    assigneeId: "p-eva",
    assigneeName: "Eva",
    assigneeEmail: "eva.real@example.com",
    roomName: "Obývák",
    status: "OPEN",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completionTokenHash: "hash123",
  };

  beforeEach(() => {
    resetConfigCache();
    process.env.ADMIN_EMAIL = "admin@example.com";
    process.env.GOOGLE_SHEET_ID_TEST = "test-sheet-id";
    delete process.env.GOOGLE_SHEET_ID_PROD;
  });

  it("redirects emails to TEST_EMAIL_RECIPIENT when not in production", async () => {
    process.env.APP_ENV = "development";
    process.env.TEST_EMAIL_RECIPIENT = "tester@byzahr.app";
    resetConfigCache();

    const emailService = new EmailService();
    const result = await emailService.sendTaskEmail(dummyTask, "sampletoken123");

    expect(result.isTestRedirected).toBe(true);
    expect(result.deliveredTo).toBe("tester@byzahr.app");
    expect(result.deliveredTo).not.toBe("eva.real@example.com");
  });

  it("blocks sending to real recipient in non-prod if TEST_EMAIL_RECIPIENT is missing", async () => {
    process.env.APP_ENV = "development";
    delete process.env.TEST_EMAIL_RECIPIENT;
    resetConfigCache();

    const emailService = new EmailService();
    const result = await emailService.sendTaskEmail(dummyTask, "sampletoken123");

    expect(result.isTestRedirected).toBe(true);
    expect(result.deliveredTo).toBe("BLOCKED_NO_TEST_RECIPIENT");
    expect(result.deliveredTo).not.toBe("eva.real@example.com");
  });

  it("sends to actual assignee when in production", async () => {
    process.env.APP_ENV = "production";
    process.env.GOOGLE_SHEET_ID_PROD = "prod-sheet-id";
    resetConfigCache();

    const emailService = new EmailService();
    const result = await emailService.sendTaskEmail(dummyTask, "sampletoken123");

    expect(result.isTestRedirected).toBe(false);
    expect(result.deliveredTo).toBe("eva.real@example.com");
  });
});
