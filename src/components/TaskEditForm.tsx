"use client";

import { DeadlinePreset, Person, Room, Task } from "@/types";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { editTaskAction, cancelTaskAction } from "@/app/actions/task-actions";
import { ArrowLeft, Clock, Save, Trash2, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface Props {
  task: Task;
  people: Person[];
  rooms: Room[];
  deadlines: DeadlinePreset[];
}

export function TaskEditForm({ task, people, rooms, deadlines }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [taskName, setTaskName] = useState(task.taskName);
  const [assigneeId, setAssigneeId] = useState(task.assigneeId);
  const [roomId, setRoomId] = useState<string>(task.roomId || "");
  const [roomName, setRoomName] = useState<string>(task.roomName || "");
  const [note, setNote] = useState<string>(task.note || "");
  const [deadline, setDeadline] = useState<string>(task.deadline || "");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const assigneeWillChange = assigneeId !== task.assigneeId;

  const handleRoomChange = (rId: string) => {
    setRoomId(rId);
    if (!rId) {
      setRoomName("");
    } else {
      const selected = rooms.find((r) => r.id === rId);
      if (selected) setRoomName(selected.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setWarningMessage(null);

    startTransition(async () => {
      try {
        const res = await editTaskAction({
          id: task.id,
          taskName: taskName.trim(),
          assigneeId,
          roomId: roomId || null,
          roomName: roomName.trim() || null,
          note: note.trim() || null,
          deadline: deadline.trim() || null,
        });

        if (res.emailWarning) {
          setWarningMessage(res.emailWarning);
        } else {
          router.push("/");
          router.refresh();
        }
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error ? err.message : "Chyba při úpravě úkolu."
        );
      }
    });
  };

  const handleCancel = () => {
    if (confirm("Opravdu zrušit tento úkol?")) {
      setErrorMessage(null);
      setWarningMessage(null);
      startTransition(async () => {
        try {
          const res = await cancelTaskAction(task.id);
          if (res.emailWarning) {
            setWarningMessage(res.emailWarning);
          } else {
            router.push("/");
            router.refresh();
          }
        } catch (err: unknown) {
          setErrorMessage(
            err instanceof Error ? err.message : "Chyba při rušení úkolu."
          );
        }
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Zpět na přehled
        </Link>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Zrušit úkol
        </button>
      </div>

      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Upravit úkol ✏️
        </h1>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold rounded-xl">
          {errorMessage}
        </div>
      )}

      {warningMessage && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs">
          <div className="flex items-center gap-2 font-bold mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Změny byly uloženy s upozorněním:</span>
          </div>
          <p>{warningMessage}</p>
          <button
            type="button"
            onClick={() => {
              router.push("/");
              router.refresh();
            }}
            className="mt-3 inline-block px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg transition-colors"
          >
            Rozumím, přejít na přehled
          </button>
        </div>
      )}

      {assigneeWillChange && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Bezpečnostní rotace odkazu</strong>
            Při změně řešitele bude vygenerován nový bezpečnostní odkaz a odeslán e-mail novému příjemci. Původní odkaz v e-mailu bude okamžitě zneplatněn.
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Název úkolu
          </label>
          <input
            type="text"
            required
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Kdo to schytá (řešitel)
          </label>
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
          >
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Místnost
          </label>
          <select
            value={roomId}
            onChange={(e) => handleRoomChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
          >
            <option value="">-- Bez místnosti --</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Termín
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {deadlines.map((qd) => (
              <button
                type="button"
                key={qd.id}
                onClick={() => setDeadline(qd.name)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                  deadline === qd.name
                    ? "bg-rose-50 border-rose-400 text-rose-700 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {qd.name}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            placeholder="např. dnes do 18:00"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Poznámka
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition-all flex items-center justify-center gap-2"
        >
          {isPending ? (
            <Clock className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Uložit změny</span>
        </button>
      </div>
    </form>
  );
}
