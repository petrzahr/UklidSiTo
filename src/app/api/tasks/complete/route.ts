import { NextRequest, NextResponse } from "next/server";
import { getTaskService } from "@/services/task-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = body?.token;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { success: false, error: "Chybí token úkolu." },
        { status: 400 }
      );
    }

    const taskService = getTaskService();
    const result = await taskService.completeTask(token);

    if (!result.success) {
      if (result.status === "CANCELLED") {
        return NextResponse.json(
          { success: false, status: "CANCELLED", message: "Tento úkol byl zrušen." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, status: "NOT_FOUND", message: "Úkol nebyl nalezen nebo je odkaz neplatný." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      status: result.status,
      completedAt: result.task.completedAt,
      taskName: result.task.taskName,
      assigneeName: result.task.assigneeName,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Chyba při dokončování úkolu.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
