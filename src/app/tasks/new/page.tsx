import { getPeopleService } from "@/services/people-service";
import { getPresetService } from "@/services/preset-service";
import { getDeadlineService } from "@/services/deadline-service";
import { getRoomService } from "@/services/room-service";
import { getTaskService } from "@/services/task-service";
import { TaskCreationForm, TaskFormInitialValues } from "@/components/TaskCreationForm";
import { requireAdminSession } from "@/lib/auth/session";
import { Person, Room, Task, TaskPreset } from "@/types";

export const dynamic = "force-dynamic";

function buildInitialValues(task: Task, people: Person[], presets: TaskPreset[], rooms: Room[]): TaskFormInitialValues {
  const hasPreset = Boolean(task.taskPresetId && presets.some((p) => p.id === task.taskPresetId));
  const hasRoom = Boolean(task.roomId && rooms.some((r) => r.id === task.roomId));
  const roomName = task.roomName ?? "";

  return {
    taskPresetId: hasPreset ? task.taskPresetId! : null,
    taskName: task.taskName,
    isCustomTask: !hasPreset,
    assigneeId: people.some((p) => p.id === task.assigneeId) ? task.assigneeId : "",
    roomId: hasRoom ? task.roomId! : null,
    roomName,
    isCustomRoom: !hasRoom && roomName.length > 0,
    note: task.note ?? "",
    deadline: task.deadline ?? "",
  };
}

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  await requireAdminSession({ redirectOnUnauth: true });

  const { from } = await searchParams;

  const [people, presets, deadlines, rooms, sourceTask] = await Promise.all([
    getPeopleService().getActive(),
    getPresetService().getActive(),
    getDeadlineService().getActive(),
    getRoomService().getActive(),
    typeof from === "string" && from ? getTaskService().getById(from) : Promise.resolve(null),
  ]);

  const initialValues = sourceTask?.status === "DONE"
    ? buildInitialValues(sourceTask, people, presets, rooms)
    : undefined;

  return (
    <TaskCreationForm
      people={people}
      presets={presets}
      rooms={rooms}
      deadlines={deadlines}
      initialValues={initialValues}
    />
  );
}
