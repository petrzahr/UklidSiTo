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
  const rooms = await getRoomService().getActive();

  return <TaskEditForm task={task} people={people} rooms={rooms} />;
}
