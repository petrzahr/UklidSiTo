import { getPeopleService } from "@/services/people-service";
import { getPresetService } from "@/services/preset-service";
import { getRoomService } from "@/services/room-service";
import { TaskCreationForm } from "@/components/TaskCreationForm";

export const dynamic = "force-dynamic";

export default async function NewTaskPage() {
  const people = await getPeopleService().getActive();
  const presets = await getPresetService().getActive();
  const rooms = await getRoomService().getActive();

  return <TaskCreationForm people={people} presets={presets} rooms={rooms} />;
}
