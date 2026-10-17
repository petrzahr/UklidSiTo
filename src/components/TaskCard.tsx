"use client";

import { Task } from "@/types";
import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Edit2,
  Loader2,
  MailCheck,
  RotateCcw,
  Send,
  Trash2,
} from "lucide-react";
import { cancelTaskAction, resendTaskEmailAction } from "@/app/actions/task-actions";

export function TaskCard({ task }: { task: Task }) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"resend" | "cancel" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCancel = () => {
    if (isPending) return;
    if (confirm(`Zrušit úkol "${task.taskName}"? Přesune se mezi zrušené úkoly a nepůjde ho potvrdit jako splněný.`)) {
      setFeedback(null);
      setErrorMessage(null);
      setPendingAction("cancel");
      startTransition(async () => {
        try {
          const res = await cancelTaskAction(task.id);
          if (res.emailWarning) {
            setFeedback(`Úkol byl zrušen. Upozornění: ${res.emailWarning}`);
          } else {
            setFeedback("Úkol zrušen.");
          }
        } catch (e: unknown) {
          setErrorMessage(e instanceof Error ? e.message : "Úkol se nepodařilo zrušit. Zkus to znovu.");
        } finally {
          setPendingAction(null);
        }
      });
    }
  };

  const handleResend = () => {
    if (isPending) return;
    setFeedback(null);
    setErrorMessage(null);
    setPendingAction("resend");
    startTransition(async () => {
      try {
        const res = await resendTaskEmailAction(task.id);
        if (res.success) {
          setFeedback("E-mail byl znovu odeslán!");
        } else {
          setErrorMessage("E-mail se nepodařilo odeslat. Zkus tlačítko Poslat e-mail znovu ještě jednou.");
        }
      } catch (e: unknown) {
        setErrorMessage(e instanceof Error ? e.message : "E-mail se nepodařilo odeslat. Zkontroluj připojení a zkus to znovu.");
      } finally {
        setPendingAction(null);
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
      className={`min-w-0 rounded-2xl border p-5 shadow-sm transition-all flex flex-col justify-between ${
        task.status === "OPEN"
          ? "bg-white border-amber-200/80 hover:border-amber-300"
          : task.status === "DONE"
          ? "border-primary-200/80 bg-primary-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div>
        {/* Header line: Task title + room */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 basis-40">
            <h2 className="text-lg font-black text-slate-900 leading-tight">
              {task.taskName}
            </h2>
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
                ? "bg-primary-100 text-primary-800"
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
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <span className="w-7 h-7 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-base">
              {task.assigneeName.startsWith("E")
                ? "👩"
                : task.assigneeName.startsWith("A")
                ? "👧"
                : "👤"}
            </span>
            <span>{task.assigneeName}</span>
          </div>

          <div className="text-xs text-slate-600 flex items-center gap-1 tabular-nums whitespace-nowrap">
            <Clock className="w-3.5 h-3.5" />
            <span>{formattedCreated}</span>
          </div>
        </div>

        {/* Deadline */}
        {task.deadline && (
          <div className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md">
            <Calendar className="w-3.5 h-3.5" />
            <span>Termín: {task.deadline}</span>
          </div>
        )}

        {/* Note */}
        {task.note && (
          <div className="mt-3 p-3 bg-slate-50 border-l border-amber-400 rounded-r-lg text-xs text-slate-700 whitespace-pre-line">
            {task.note}
          </div>
        )}

        {/* Completion Info */}
        {task.status === "DONE" && formattedCompleted && (
          <div className="mt-3 text-xs text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5">
            <MailCheck className="w-3.5 h-3.5" />
            <span>Splněno: {formattedCompleted}</span>
          </div>
        )}

        <div role="status" aria-atomic="true" className="text-xs font-bold text-primary-700">
          {(pendingAction || feedback) && (
            <p className="mt-2">
              {pendingAction === "resend" ? "Odesílám e-mail…" : pendingAction === "cancel" ? "Ruším úkol…" : feedback}
            </p>
          )}
        </div>
        {errorMessage && <p role="alert" className="mt-2 text-xs font-bold text-rose-800">{errorMessage}</p>}
      </div>

      {/* Action Footer for OPEN tasks */}
      {task.status === "OPEN" && (
        <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={handleResend}
              disabled={isPending}
              aria-busy={pendingAction === "resend"}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium transition-colors"
              title="Poslat e-mail znovu"
            >
              {pendingAction === "resend" ? <Loader2 aria-hidden="true" className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              <span>{pendingAction === "resend" ? "Odesílám e-mail…" : "Poslat e-mail znovu"}</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <Link
              href={`/tasks/${task.id}/edit`}
              className="inline-flex items-center justify-center min-h-11 min-w-11 p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Upravit úkol"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={handleCancel}
              disabled={isPending}
              aria-label={pendingAction === "cancel" ? "Ruším úkol…" : "Zrušit úkol"}
              aria-busy={pendingAction === "cancel"}
              className="inline-flex items-center justify-center min-h-11 min-w-11 p-1.5 rounded-md text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Zrušit úkol"
            >
              {pendingAction === "cancel" ? <Loader2 aria-hidden="true" className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Action Footer for DONE tasks */}
      {task.status === "DONE" && (
        <div className="mt-5 pt-3 border-t border-primary-100 flex flex-wrap items-center gap-2">
          <Link
            href={`/tasks/new?from=${encodeURIComponent(task.id)}`}
            className="inline-flex items-center gap-1 min-h-11 px-2.5 py-1 rounded-md text-xs text-slate-600 hover:text-slate-900 hover:bg-primary-100 font-medium transition-colors"
            title="Zadat úkol znovu"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Zadat znovu</span>
          </Link>
        </div>
      )}
    </div>
  );
}
