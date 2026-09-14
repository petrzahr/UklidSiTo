import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsView } from "@/components/SettingsView";
import { TaskCreationForm } from "@/components/TaskCreationForm";
import { TaskEditForm } from "@/components/TaskEditForm";
import { Header } from "@/components/Header";
import LoginPage from "@/app/login/page";
import type { DeadlinePreset, Task } from "@/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/app/actions/settings-actions", () => ({}));
vi.mock("@/app/actions/task-actions", () => ({}));

const deadlines: DeadlinePreset[] = [{
  id: "custom", name: "Do oběda", active: true, sortOrder: 1, createdAt: "", updatedAt: "",
}];
const task: Task = {
  id: "task", taskName: "Úklid", assigneeId: "person", assigneeName: "Eva", assigneeEmail: "eva@example.com",
  status: "OPEN", createdAt: "", updatedAt: "", completionTokenHash: "hash", deadline: "Historický termín",
};

describe("Deadline UI and Czech copy", () => {
  beforeEach(() => vi.stubGlobal("React", React));

  it("places Termíny immediately after Místnosti and uses the requested crew copy", () => {
    const html = renderToStaticMarkup(<SettingsView people={[]} presets={[]} rooms={[]} deadlines={deadlines}
      systemInfo={{ maskedSheetId: "sheet", storageType: "Google Sheets", adminEmail: "admin@example.com" }} />);
    expect(html.indexOf("Místnosti")).toBeLessThan(html.indexOf("Termíny"));
    expect(html.indexOf("Termíny")).toBeLessThan(html.indexOf("Systém"));
    expect(html).toContain("Úklidová četa se nepřihlašuje. Úkoly potvrzují přes odkaz v e-mailu.");
  });

  it("renders configured choices in both task forms and preserves historical text", () => {
    const createHtml = renderToStaticMarkup(<TaskCreationForm people={[]} presets={[]} rooms={[]} deadlines={deadlines} />);
    const editHtml = renderToStaticMarkup(<TaskEditForm task={task} people={[]} rooms={[]} deadlines={deadlines} />);
    for (const html of [createHtml, editHtml]) {
      expect(html).toContain("Do oběda");
      expect(html).not.toContain("Do pátku");
    }
    expect(editHtml).toContain('value="Historický termín"');
  });

  it("renders corrected header and login text", () => {
    const header = renderToStaticMarkup(<Header />);
    const login = renderToStaticMarkup(<LoginPage />);
    for (const html of [header, login]) {
      expect(html).toContain("Domácnost se sama neuklidí");
      expect(html).not.toContain("Domácnost sama se neuklidí");
    }
    expect(login).toContain("Úklidová četa se nepřihlašuje. Úkoly potvrzují přes odkaz v e-mailu.");
  });
});
