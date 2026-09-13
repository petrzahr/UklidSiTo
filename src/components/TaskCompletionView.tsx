"use client";

import { Task } from "@/types";
import { useState, useTransition } from "react";
import { CheckCircle2, Clock, Sparkles, XCircle, AlertCircle } from "lucide-react";

interface Props {
  token: string;
  initialTask: Task | null;
  error?: "NOT_FOUND" | "INVALID" | null;
}

const SUCCESS_MESSAGES = [
  "✅ Uklizeno!",
  "🧹 Pořádek byl obnoven.",
  "🫡 Domácnost děkuje za spolupráci.",
  "🏆 Jeden bod pro uklízecí četu.",
  "Další domácí katastrofa zažehnána.",
  "🎉 Zázraky se dějí, je čisto!",
];

export function TaskCompletionView({ token, initialTask, error }: Props) {
  const [task, setTask] = useState<Task | null>(initialTask);
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (error || !task) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-12">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-lg">
          <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
            🔍
          </div>
          <h1 className="text-xl font-black text-slate-900 mb-2">
            Úkol nenalezen
          </h1>
          <p className="text-sm text-slate-500">
            Tento odkaz je buď neplatný, nebo byl úkol zrušen či přeřazen jinému členu domácnosti.
          </p>
        </div>
      </div>
    );
  }

  if (task.status === "CANCELLED") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-12">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-lg">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
            🕊️
          </div>
          <h1 className="text-xl font-black text-slate-700 mb-2">
            Tento úkol byl zrušen
          </h1>
          <p className="text-sm text-slate-500">
            Máš štěstí! Administrátor tento úkol stornoval, takže uklízet nemusíš.
          </p>
        </div>
      </div>
    );
  }

  if (task.status === "DONE") {
    const formattedCompleted = task.completedAt
      ? new Date(task.completedAt).toLocaleString("cs-CZ", {
          day: "numeric",
          month: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "dříve";

    return (
      <div className="min-h-[60vh] flex items-center justify-center py-12">
        <div className="w-full max-w-md bg-white rounded-3xl border border-emerald-200 p-8 sm:p-10 text-center shadow-xl">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl shadow-inner animate-bounce">
            🎉
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">
            Tento úkol už je splněný!
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            Úkol <strong>"{task.taskName}"</strong> byl úspěšně označen jako hotový.
          </p>

          <div className="bg-emerald-50 rounded-xl p-4 text-xs font-semibold text-emerald-800 border border-emerald-100 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Splněno: {formattedCompleted}</span>
          </div>
        </div>
      </div>
    );
  }

  const handleComplete = () => {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/tasks/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setErrorMessage(data.message || "Nepodařilo se dokončit úkol.");
          return;
        }

        // Pick a random friendly celebration message
        const randomMsg =
          SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)];
        setStatusMessage(randomMsg);
        setTask((prev) => (prev ? { ...prev, status: "DONE", completedAt: data.completedAt } : null));
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error ? err.message : "Chyba při komunikaci se serverem."
        );
      }
    });
  };

  return (
    <div className="min-h-[65vh] flex items-center justify-center py-8 px-2">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl text-center">
        {/* Playful Header */}
        <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">
          🧹
        </div>

        <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
          Úkol pro: {task.assigneeName}
        </span>

        {/* Task Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 mb-3 tracking-tight">
          {task.taskName}
        </h1>

        {/* Room badge */}
        {task.roomName && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full mb-4">
            <span>🏠</span>
            <span>{task.roomName}</span>
          </div>
        )}

        {/* Deadline notice */}
        {task.deadline && (
          <div className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-md">
            <Clock className="w-3.5 h-3.5" />
            <span>Termín: {task.deadline}</span>
          </div>
        )}

        {/* Note if provided */}
        {task.note && (
          <div className="mb-6 p-4 bg-amber-50/80 border border-amber-200/70 rounded-2xl text-left text-xs sm:text-sm text-slate-700">
            <span className="block font-bold text-amber-900 mb-1">
              Poznámka od zadavatele:
            </span>
            <p className="whitespace-pre-line">{task.note}</p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Explicit POST Completion Action */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleComplete}
            disabled={isPending}
            className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-lg sm:text-xl rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2.5"
          >
            {isPending ? (
              <>
                <Clock className="w-5 h-5 animate-spin" />
                <span>Ukládám...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                <span>MÁM HOTOVO</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-slate-400">
            Kliknutím potvrdíš splnění úkolu. Žádné přihlašování není potřeba.
          </p>
        </div>
      </div>
    </div>
  );
}
