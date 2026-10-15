import React, { useState, useTransition } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TaskCard } from "@/components/TaskCard";
import { cancelTaskAction, resendTaskEmailAction } from "@/app/actions/task-actions";
import type { Task } from "@/types";

vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useState: vi.fn(), useTransition: vi.fn(),
}));
vi.mock("@/app/actions/task-actions", () => ({
  cancelTaskAction: vi.fn(), resendTaskEmailAction: vi.fn(),
}));

function findAction(node: React.ReactNode, title: string): (() => void) | undefined {
  if (!React.isValidElement(node)) return;
  const props = node.props as { title?: string; onClick?: () => void; children?: React.ReactNode };
  if (props.title === title) return props.onClick;
  for (const child of React.Children.toArray(props.children)) {
    const action = findAction(child, title);
    if (action) return action;
  }
}

const task: Task = {
  id: "task", taskName: "Úklid", assigneeId: "person", assigneeName: "Eva", assigneeEmail: "eva@example.com",
  status: "OPEN", createdAt: "2026-10-15T12:00:00Z", updatedAt: "", completionTokenHash: "hash",
};

describe("Task card action feedback", () => {
  const setFeedback = vi.fn(), setPendingAction = vi.fn(), setErrorMessage = vi.fn();
  let work: Promise<unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("React", React);
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    vi.mocked(useState).mockReturnValueOnce([null, setFeedback])
      .mockReturnValueOnce([null, setPendingAction]).mockReturnValueOnce([null, setErrorMessage]);
    vi.mocked(useTransition).mockReturnValue([false, (action) => { work = Promise.resolve(action()); }]);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("clears sending status and exposes an inline error after a delivery failure", async () => {
    vi.mocked(resendTaskEmailAction).mockResolvedValue({ success: false } as Awaited<ReturnType<typeof resendTaskEmailAction>>);
    findAction(TaskCard({ task }), "Poslat e-mail znovu")!();
    expect(setPendingAction).toHaveBeenCalledWith("resend");
    await work;
    expect(setPendingAction).toHaveBeenLastCalledWith(null);
    expect(setErrorMessage).toHaveBeenLastCalledWith(expect.stringContaining("nepodařilo odeslat"));
  });

  it("recovers sending state after a network exception", async () => {
    vi.mocked(resendTaskEmailAction).mockRejectedValue(new Error("Spojení přerušeno"));
    findAction(TaskCard({ task }), "Poslat e-mail znovu")!();
    await work;
    expect(setPendingAction).toHaveBeenLastCalledWith(null);
    expect(setErrorMessage).toHaveBeenLastCalledWith("Spojení přerušeno");
  });

  it("distinguishes cancellation from sending and reports cancellation failure inline", async () => {
    vi.mocked(cancelTaskAction).mockRejectedValue(new Error("Úkol nelze zrušit"));
    findAction(TaskCard({ task }), "Zrušit úkol")!();
    expect(setPendingAction).toHaveBeenCalledWith("cancel");
    await work;
    expect(setPendingAction).toHaveBeenLastCalledWith(null);
    expect(setErrorMessage).toHaveBeenLastCalledWith("Úkol nelze zrušit");
  });
});
