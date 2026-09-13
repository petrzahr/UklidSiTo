import { getTaskService } from "@/services/task-service";
import { TaskCompletionView } from "@/components/TaskCompletionView";

export const dynamic = "force-dynamic";

export default async function PublicTaskPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!token) {
    return <TaskCompletionView token="" initialTask={null} error="INVALID" />;
  }

  // GET is strictly read-only! Never complete task on GET!
  const taskService = getTaskService();
  const task = await taskService.getByToken(token);

  if (!task) {
    return <TaskCompletionView token={token} initialTask={null} error="NOT_FOUND" />;
  }

  return <TaskCompletionView token={token} initialTask={task} />;
}
