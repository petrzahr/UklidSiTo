import { describe, it, expect, beforeEach, vi } from "vitest";
import { EmailService } from "@/services/email-service";
import { Task } from "@/types";
import { resetConfigCache } from "@/lib/config/env";

const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("resend", () => ({
  Resend: class { emails = { send }; },
}));

describe("Task Email Delivery", () => {
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
    send.mockReset();
    send.mockResolvedValue({ data: { id: "message-1" }, error: null });
    resetConfigCache();
    process.env.ADMIN_EMAIL = "admin@example.com";
    delete process.env.RESEND_API_KEY;
  });

  it("sends to actual assignee when in production", async () => {
    process.env.GOOGLE_SHEET_ID_PROD = "prod-sheet-id";
    resetConfigCache();

    const emailService = new EmailService();
    const result = await emailService.sendTaskEmail(dummyTask, "sampletoken123");

    expect(result.deliveredTo).toBe("eva.real@example.com");
  });
  it.each(["sendTaskEmail", "sendTaskUpdatedEmail", "sendTaskCancelledEmail"] as const)(
    "%s delivers through Resend to the assignee without a test banner",
    async (method) => {
      process.env.RESEND_API_KEY = "mock-key";
      const result = await new EmailService()[method](dummyTask, "sampletoken123");
      expect(result.success).toBe(true);
      expect(result.deliveredTo).toBe(dummyTask.assigneeEmail);
      expect(send).toHaveBeenCalledWith(expect.objectContaining({
        to: dummyTask.assigneeEmail,
        from: "UklidSiTo <uklid@uklidsito.byzahr.app>",
      }));
      const html = send.mock.calls[0][0].html;
      expect(html).not.toContain("TEST EMAIL");
      if (method === "sendTaskCancelledEmail") {
        expect(html).not.toContain("/task/sampletoken123");
      } else {
        expect(html).toContain("https://uklidsito.byzahr.app/task/sampletoken123");
      }
    }
  );
});
