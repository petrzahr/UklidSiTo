import { getTaskService } from "@/services/task-service";
import { getPeopleService } from "@/services/people-service";
import { getRoomService } from "@/services/room-service";
import { TaskEditForm } from "@/components/TaskEditForm";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSession({ redirectOnUnauth: true });

  const { id } = await params;
  const taskService = getTaskService();
  const task = await taskService.getById(id);

  if (!task) {
    notFound();
  }

  const people = await getPeopleService().getActive();
  if (task.assigneeId && !people.some((p) => p.id === task.assigneeId)) {
    const historicalPerson = await getPeopleService().getById(task.assigneeId);
    if (historicalPerson) {
      people.push({
        ...historicalPerson,
        name: `${historicalPerson.name} (neaktivní)`,
      });
    }
  }

  const rooms = await getRoomService().getActive();
  if (task.roomId && !rooms.some((r) => r.id === task.roomId)) {
    const historicalRoom = await getRoomService().getById(task.roomId);
    if (historicalRoom) {
      rooms.push({
        ...historicalRoom,
        name: `${historicalRoom.name} (neaktivní)`,
      });
    }
  }

  return <TaskEditForm task={task} people={people} rooms={rooms} />;
}
