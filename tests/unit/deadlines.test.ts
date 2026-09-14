import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryDataStore } from "@/repositories/memory-store";
import { setDataStoreForTesting } from "@/repositories";
import { DeadlineService } from "@/services/deadline-service";
import { RoomService } from "@/services/room-service";
import { TaskService } from "@/services/task-service";
import { createDeadlineAction, updateDeadlineAction } from "@/app/actions/settings-actions";

const { authorize, revalidatePath } = vi.hoisted(() => ({
  authorize: vi.fn(), revalidatePath: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ requireAdminSession: authorize }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/services/email-service", () => ({ getEmailService: () => ({
  sendTaskEmail: vi.fn(async () => ({ success: true, deliveredTo: "person@example.com" })),
  sendTaskUpdatedEmail: vi.fn(async () => ({ success: true, deliveredTo: "person@example.com" })),
}) }));

describe("Configurable deadlines", () => {
  let store: MemoryDataStore;
  beforeEach(() => {
    store = new MemoryDataStore();
    setDataStoreForTesting(store);
    authorize.mockReset().mockResolvedValue({ email: "admin@example.com" });
    revalidatePath.mockClear();
  });

  it("preserves the original quick choices", async () => {
    expect((await new DeadlineService().getActive()).map((d) => d.name))
      .toEqual(["Dnes", "Dnes večer", "Zítra", "Do pátku", "O víkendu"]);
  });

  it("creates, renames, deactivates and reactivates through validated settings actions", async () => {
    const { deadline } = await createDeadlineAction({ name: "  Do oběda  ", active: true, sortOrder: 0 });
    expect((await new DeadlineService().getActive())[0].name).toBe("Do oběda");
    await updateDeadlineAction(deadline.id, { name: "Do večeře", active: false });
    expect((await new DeadlineService().getActive()).some((d) => d.id === deadline.id)).toBe(false);
    expect(await new DeadlineService().getById(deadline.id)).toMatchObject({ name: "Do večeře", active: false });
    await updateDeadlineAction(deadline.id, { active: true });
    expect((await new DeadlineService().getActive())[0].name).toBe("Do večeře");
    expect(revalidatePath).toHaveBeenCalledWith("/settings");
    expect(revalidatePath).toHaveBeenCalledWith("/tasks/new");
    expect(revalidatePath).toHaveBeenCalledWith("/tasks/[id]/edit", "page");
    expect((await store.activity.getAll()).map((a) => a.eventType)).toEqual(expect.arrayContaining([
      "DEADLINE_CREATED", "DEADLINE_DEACTIVATED", "DEADLINE_ACTIVATED",
    ]));
  });

  it("rejects blank/oversized names and unauthorized writes", async () => {
    await expect(createDeadlineAction({ name: " ", active: true, sortOrder: 0 })).rejects.toThrow();
    await expect(updateDeadlineAction("d-1", { name: "x".repeat(101) })).rejects.toThrow();
    authorize.mockRejectedValue(new Error("Unauthorized"));
    await expect(updateDeadlineAction("d-1", { active: false })).rejects.toThrow("Unauthorized");
    expect((await store.deadlines.getById("d-1"))?.active).toBe(true);
  });

  it("keeps task deadline snapshots and custom values while settings change", async () => {
    const deadlines = new DeadlineService();
    const selected = (await deadlines.getActive())[0];
    const tasks = new TaskService();
    const { task } = await tasks.createTask({ taskName: "Úklid", assigneeId: "p-eva", deadline: selected.name }, "admin@example.com");
    await deadlines.update(selected.id, { name: "Později", active: false }, "admin@example.com");
    expect((await tasks.getById(task.id))?.deadline).toBe("Dnes");
    await tasks.editTask({ id: task.id, deadline: "Vlastní termín do 18:00" }, "admin@example.com");
    expect((await tasks.getById(task.id))?.deadline).toBe("Vlastní termín do 18:00");
  });

  it("preserves independent room management", async () => {
    const rooms = new RoomService();
    const room = await rooms.create({ name: "Pracovna" }, "admin@example.com");
    await rooms.update(room.id, { name: "Dílna", active: false }, "admin@example.com");
    expect((await rooms.getActive()).some((r) => r.id === room.id)).toBe(false);
    await rooms.update(room.id, { active: true }, "admin@example.com");
    expect(await rooms.getById(room.id)).toMatchObject({ name: "Dílna", active: true });
    expect((await new DeadlineService().getAll()).length).toBe(5);
  });
});
