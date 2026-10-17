import React, { useState, useTransition } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TaskCreationForm } from "@/components/TaskCreationForm";
import { createTaskAction } from "@/app/actions/task-actions";
import type { Person, TaskPreset } from "@/types";

vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useState: vi.fn(), useTransition: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/app/actions/task-actions", () => ({ createTaskAction: vi.fn() }));

function findAll(node: React.ReactNode, match: (props: Record<string, unknown>) => boolean): Record<string, unknown>[] {
  if (!React.isValidElement(node)) return [];
  const props = node.props as Record<string, unknown> & { children?: React.ReactNode };
  const own = match(props) ? [props] : [];
  return own.concat(React.Children.toArray(props.children).flatMap((child) => findAll(child, match)));
}

const people = [{ id: "p1", name: "Eva", email: "eva@example.com" }] as Person[];
const presets = [{ id: "pr1", name: "Vysát", icon: "🧹" }] as TaskPreset[];

describe("Task creation form prefill", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("React", React);
    vi.mocked(useState).mockImplementation(((init: unknown) => [init, vi.fn()]) as typeof useState);
    vi.mocked(useTransition).mockReturnValue([false, vi.fn()]);
  });

  it("pre-selects values from the completed task without submitting", () => {
    const tree = TaskCreationForm({
      people, presets, rooms: [], deadlines: [],
      initialValues: {
        taskPresetId: "pr1", taskName: "Vysát", isCustomTask: false, assigneeId: "p1",
        roomId: null, roomName: "Garáž", isCustomRoom: true, note: "I pod gaučem", deadline: "do večera",
      },
    });

    const pressed = findAll(tree, (p) => p["aria-pressed"] === true);
    expect(pressed).toHaveLength(3); // preset, assignee, custom room
    expect(findAll(tree, (p) => p["aria-label"] === "Poznámka")[0]?.value).toBe("I pod gaučem");
    expect(findAll(tree, (p) => p["aria-label"] === "Termín")[0]?.value).toBe("do večera");
    expect(findAll(tree, (p) => p["aria-label"] === "Vlastní místnost")[0]?.value).toBe("Garáž");
    expect(findAll(tree, (p) => p.children === "Zadáváš znovu splněný úkol – zkontroluj údaje a potvrď.")).toHaveLength(1);
    expect(createTaskAction).not.toHaveBeenCalled();
  });

  it("renders an empty form without initial values", () => {
    const tree = TaskCreationForm({ people, presets, rooms: [], deadlines: [] });
    expect(findAll(tree, (p) => p["aria-pressed"] === true)).toHaveLength(0);
    expect(findAll(tree, (p) => typeof p.children === "string" && p.children.startsWith("Zadáváš znovu"))).toHaveLength(0);
  });
});
