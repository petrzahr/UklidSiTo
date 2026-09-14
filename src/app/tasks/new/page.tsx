import { getPeopleService } from "@/services/people-service";
import { getPresetService } from "@/services/preset-service";
import { getDeadlineService } from "@/services/deadline-service";
import { getRoomService } from "@/services/room-service";
import { TaskCreationForm } from "@/components/TaskCreationForm";
import { requireAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function NewTaskPage() {
  await requireAdminSession({ redirectOnUnauth: true });

  const people = await getPeopleService().getActive();
  const presets = await getPresetService().getActive();
  const deadlines = await getDeadlineService().getActive();
  const rooms = await getRoomService().getActive();

  return <TaskCreationForm people={people} presets={presets} rooms={rooms} deadlines={deadlines} />;
}
