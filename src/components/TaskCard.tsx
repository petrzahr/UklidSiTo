"use client";

import { Task } from "@/types";
import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Edit2,
  MailCheck,
  RotateCw,
  Send,
  Trash2,
  User,
} from "lucide-react";
import { cancelTaskAction, resendTaskEmailAction } from "@/app/actions/task-actions";

export function TaskCard({ task }: { task: Task }) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCancel = () => {
    if (confirm(`Opravdu zrušit úkol "${task.taskName}"?`)) {
      startTransition(async () => {
        try {
          const res = await cancelTaskAction(task.id);
          if (res.emailWarning) {
            setFeedback(`Úkol byl zrušen. Upozornění: ${res.emailWarning}`);
          } else {
            setFeedback("Úkol zrušen.");
          }
        } catch (e: unknown) {
          alert(e instanceof Error ? e.message : "Chyba při rušení úkolu");
        }
      });
    }
  };

  const handleResend = () => {
    startTransition(async () => {
      try {
        const res = await resendTaskEmailAction(task.id);
        if (res.success) {
          setFeedback("E-mail byl znovu odeslán!");
        } else {
          setFeedback("Odeslání selhalo.");
        }
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : "Chyba při odesílání e-mailu");
      }
    });
  };

  const formattedCreated = new Date(task.createdAt).toLocaleString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedCompleted = task.completedAt
    ? new Date(task.completedAt).toLocaleString("cs-CZ", {
        day: "numeric",
        month: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div
      className={`bg-white rounded-2xl border p-5 shadow-sm transition-all flex flex-col justify-between ${
        task.status === "OPEN"
          ? "border-amber-200/80 hover:border-amber-300"
          : task.status === "DONE"
          ? "border-emerald-200/80 bg-emerald-50/20"
          : "border-slate-200 opacity-75"
      }`}
    >
      <div>
        {/* Header line: Task title + room */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-slate-900 leading-tight">
              {task.taskName}
            </h3>
            {task.roomName && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 mt-1">
                🏠 {task.roomName}
              </span>
            )}
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-xs font-black shrink-0 ${
              task.status === "OPEN"
                ? "bg-amber-100 text-amber-800"
                : task.status === "DONE"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {task.status === "OPEN"
              ? "Čeká"
              : task.status === "DONE"
              ? "Hotovo ✅"
              : "Zrušeno"}
          </span>
        </div>

        {/* Assignee */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-base">
              {task.assigneeName.startsWith("E")
                ? "👩"
                : task.assigneeName.startsWith("A")
                ? "👧"
                : "👤"}
            </span>
            <span>{task.assigneeName}</span>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{formattedCreated}</span>
          </div>
        </div>

        {/* Deadline */}
        {task.deadline && (
          <div className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md">
            <Calendar className="w-3.5 h-3.5" />
            <span>Termín: {task.deadline}</span>
          </div>
        )}

        {/* Note */}
        {task.note && (
          <div className="mt-3 p-3 bg-slate-50 border-l-2 border-amber-400 rounded-r-lg text-xs text-slate-700">
            {task.note}
          </div>
        )}

        {/* Completion Info */}
        {task.status === "DONE" && formattedCompleted && (
          <div className="mt-3 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5">
            <MailCheck className="w-3.5 h-3.5" />
            <span>Splněno: {formattedCompleted}</span>
          </div>
        )}

        {feedback && (
          <div className="mt-2 text-xs font-bold text-emerald-600 animate-pulse">
            {feedback}
          </div>
        )}
      </div>

      {/* Action Footer for OPEN tasks */}
      {task.status === "OPEN" && (
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={handleResend}
              disabled={isPending}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium transition-colors"
              title="Poslat e-mail znovu"
            >
              <Send className="w-3 h-3" />
              <span>Poslat znovu</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <Link
              href={`/tasks/${task.id}/edit`}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Upravit úkol"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Zrušit úkol"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
