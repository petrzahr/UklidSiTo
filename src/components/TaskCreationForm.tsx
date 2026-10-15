"use client";

import { DeadlinePreset, Person, Room, TaskPreset } from "@/types";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTaskAction } from "@/app/actions/task-actions";
import { ArrowLeft, Loader2, X } from "lucide-react";
import Link from "next/link";

interface Props {
  people: Person[];
  presets: TaskPreset[];
  rooms: Room[];
  deadlines: DeadlinePreset[];
}

export function TaskCreationForm({ people, presets, rooms, deadlines }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Selected state
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [taskName, setTaskName] = useState<string>("");
  const [isCustomTask, setIsCustomTask] = useState(false);
  const [saveAsPreset, setSaveAsPreset] = useState(false);

  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>("");

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string>("");
  const [isCustomRoom, setIsCustomRoom] = useState(false);
  const [saveAsRoomPreset, setSaveAsRoomPreset] = useState(false);

  const [note, setNote] = useState<string>("");
  const [deadline, setDeadline] = useState<string>("");

  const [emailSent, setEmailSent] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelectPreset = (preset: TaskPreset) => {
    setSelectedPresetId(preset.id);
    setTaskName(preset.name);
    setIsCustomTask(false);
    setSaveAsPreset(false);
  };

  const handleSelectCustomTask = () => {
    setSelectedPresetId(null);
    setTaskName("");
    setIsCustomTask(true);
  };

  const handleSelectRoom = (room: Room) => {
    if (selectedRoomId === room.id) {
      // Toggle off
      setSelectedRoomId(null);
      setRoomName("");
    } else {
      setSelectedRoomId(room.id);
      setRoomName(room.name);
      setIsCustomRoom(false);
      setSaveAsRoomPreset(false);
    }
  };

  const handleSelectCustomRoom = () => {
    setSelectedRoomId(null);
    setRoomName("");
    setIsCustomRoom(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const effectiveTaskName = taskName.trim();
    if (!effectiveTaskName) {
      setErrorMessage("Vyber úkol ze seznamu nebo napiš vlastní název.");
      return;
    }

    if (!selectedAssigneeId) {
      setErrorMessage("Vyber, kdo má úkol splnit. Pokud je četa prázdná, přidej člena v Nastavení.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createTaskAction({
          taskPresetId: selectedPresetId,
          taskName: effectiveTaskName,
          roomId: selectedRoomId,
          roomName: roomName.trim() || undefined,
          assigneeId: selectedAssigneeId,
          note: note.trim() || undefined,
          deadline: deadline.trim() || undefined,
          saveAsPreset,
          saveAsRoomPreset,
        });

        if (result.success) {
          const person = people.find((p) => p.id === selectedAssigneeId);
          setEmailSent(result.emailResult.success);
          setSubmittedMessage(result.emailResult.success
            ? `✅ Úkol zadán pro: ${person?.name || "člena čety"}.`
            : "Úkol je uložený, ale e-mail se nepodařilo odeslat.");
        }
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error ? err.message : "Úkol se nepodařilo uložit. Než ho zadáš znovu, zkontroluj přehled úkolů."
        );
      }
    });
  };

  const handleResetForm = () => {
    setSelectedPresetId(null);
    setTaskName("");
    setIsCustomTask(false);
    setSaveAsPreset(false);
    setSelectedAssigneeId("");
    setSelectedRoomId(null);
    setRoomName("");
    setIsCustomRoom(false);
    setSaveAsRoomPreset(false);
    setNote("");
    setDeadline("");
    setSubmittedMessage(null);
    setErrorMessage(null);
  };

  if (submittedMessage) {
    return (
      <div className="relative bg-white rounded-3xl border border-primary-200 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-xl animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={() => router.push("/")}
          title="Zpět na přehled"
          className="absolute top-4 right-4 p-2 text-slate-600 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Zpět na přehled"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-6xl mb-4">🫡</div>
        <h2 tabIndex={-1} ref={(element) => element?.focus()} className="text-2xl font-black text-slate-900 mb-2">
          {submittedMessage}
        </h2>
        <p className="text-sm text-slate-500 mb-8">
          {emailSent ? "E-mail s úkolem a odkazem pro potvrzení splnění byl odeslán." : "Úkol nezadávej znovu. V přehledu u něj použij tlačítko Poslat e-mail znovu."}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 text-sm"
          >
            Zpět na přehled
          </button>
          <button
            type="button"
            onClick={handleResetForm}
            className="w-full sm:w-auto px-6 py-3 bg-primary-50 hover:bg-primary-100 text-primary-800 font-bold rounded-xl border border-primary-200 transition-all active:scale-95 text-sm"
          >
            Nahlásit další bordel
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Zpět na přehled
        </Link>
        <span className="text-xs font-bold text-primary-700 bg-primary-50 px-3 py-1 rounded-full">
          Rychlé zadání
        </span>
      </div>

      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Nahlásit bordel 🧹
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Pár kliknutí a úkol je na cestě k příslušnému provinilci.
        </p>
      </div>

      {errorMessage && (
        <div role="alert" className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold rounded-xl">
          {errorMessage}
        </div>
      )}

      {/* STEP 1: TASK SELECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <span className="w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px]">
              1
            </span>
            <span>Co je potřeba udělat? (povinné)</span>
          </h2>
        </div>

        {/* Presets grid */}
        <div role="group" aria-label="Úkol" className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:grid-cols-3 gap-2.5">
          {presets.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                type="button"
                key={preset.id}
                aria-pressed={isSelected}
                onClick={() => handleSelectPreset(preset)}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all active:scale-95 ${
                  isSelected
                    ? "bg-primary-50 border-primary-500 ring-2 ring-primary-500/20 text-primary-950 font-bold shadow-sm"
                    : "bg-slate-50/70 hover:bg-slate-100 border-slate-200 text-slate-800 font-medium"
                }`}
              >
                <span className="text-xl shrink-0">{preset.icon || "✨"}</span>
                <span className="min-w-0 text-xs sm:text-sm leading-tight break-words">
                  {preset.name}
                </span>
              </button>
            );
          })}

          {/* Custom Task Button */}
          <button
            type="button"
            onClick={handleSelectCustomTask}
            aria-pressed={isCustomTask}
            className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all active:scale-95 ${
              isCustomTask
                ? "bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 font-bold shadow-sm"
                : "bg-slate-50 hover:bg-slate-100 border-dashed border-slate-300 text-slate-700 font-medium"
            }`}
          >
            <span className="text-xl">✏️</span>
            <span className="text-xs sm:text-sm">Jiný úkol...</span>
          </button>
        </div>

        {/* Custom task input */}
        {isCustomTask && (
          <div className="pt-2 space-y-2">
            <input
              type="text"
              placeholder="Napiš, co je potřeba udělat..."
              aria-label="Vlastní název úkolu"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
              autoFocus
            />
            <label className="flex min-h-11 items-center gap-2 text-xs text-slate-600 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={saveAsPreset}
                onChange={(e) => setSaveAsPreset(e.target.checked)}
                className="w-4 h-4 rounded text-primary-700 focus:ring-primary-500 border-slate-300"
              />
              <span>Nabízet tento úkol i příště</span>
            </label>
          </div>
        )}
      </div>

      {/* STEP 2: ASSIGNEE SELECTION */}
      <div id="task-assignee" className="scroll-mt-28 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <span className="w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px]">
            2
          </span>
          <span>Kdo to schytá? (povinné)</span>
        </h2>

        {people.length === 0 && (
          <div className="space-y-2 text-sm text-slate-700">
            <p>Nejdřív přidej člena úklidové čety. Bez něj nemá kdo úkol splnit.</p>
            <Link href="/settings" className="inline-flex items-center font-bold text-primary-800 underline underline-offset-4">
              Přidat člena v Nastavení
            </Link>
          </div>
        )}

        <div role="group" aria-label="Řešitel úkolu" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {people.map((person) => {
            const isSelected = selectedAssigneeId === person.id;
            return (
              <button
                type="button"
                key={person.id}
                aria-pressed={isSelected}
                onClick={() => setSelectedAssigneeId(person.id)}
                className={`p-4 rounded-xl border flex items-center gap-3 transition-all active:scale-95 ${
                  isSelected
                    ? "bg-primary-700 text-white border-primary-700 shadow-md ring-4 ring-primary-500/20"
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${
                    isSelected ? "bg-white/20" : "bg-white shadow-sm"
                  }`}
                >
                  {person.emoji || (person.name.startsWith("E") ? "👩" : "👧")}
                </div>
                <div className="min-w-0 text-left">
                  <p className="font-extrabold text-base leading-tight break-words">
                    {person.name}
                  </p>
                  <p
                    className={`text-[11px] break-all mt-1 ${
                      isSelected ? "text-primary-100" : "text-slate-600"
                    }`}
                  >
                    {person.email}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 3: OPTIONAL DETAILS (ROOM, DEADLINE, NOTE) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <span className="w-5 h-5 bg-slate-600 text-white rounded-full flex items-center justify-center text-[10px]">
            3
          </span>
          <span>Detaily (volitelné)</span>
        </h2>

        {/* Room selection */}
        <div>
          <span className="block text-xs font-bold text-slate-700 mb-2">
            Místnost
          </span>
          <div role="group" aria-label="Místnost" className="flex flex-wrap gap-2">
            {rooms.map((room) => {
              const isSelected = selectedRoomId === room.id;
              return (
                <button
                  type="button"
                  key={room.id}
                  aria-pressed={isSelected}
                  onClick={() => handleSelectRoom(room)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {room.name}
                </button>
              );
            })}
            <button
              type="button"
              onClick={handleSelectCustomRoom}
              aria-pressed={isCustomRoom}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border border-dashed transition-colors ${
                isCustomRoom
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100"
              }`}
            >
              Jiná místnost...
            </button>
          </div>

          {isCustomRoom && (
            <div className="mt-2 space-y-2">
              <input
                type="text"
                placeholder="Název místnosti..."
                aria-label="Vlastní místnost"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <label className="flex min-h-11 items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAsRoomPreset}
                  onChange={(e) => setSaveAsRoomPreset(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-primary-700"
                />
                <span>Nabízet tuto místnost i příště</span>
              </label>
            </div>
          )}
        </div>

        {/* Deadline */}
        <div>
          <span className="block text-xs font-bold text-slate-700 mb-2">
            Termín
          </span>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {deadlines.map((qd) => (
              <button
                type="button"
                key={qd.id}
                aria-pressed={deadline === qd.name}
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
            placeholder="Nebo zadej vlastní termín (např. do 18:00)..."
            aria-label="Termín"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Note */}
        <div>
          <span className="block text-xs font-bold text-slate-700 mb-2">
            Poznámka
          </span>
          <textarea
            rows={2}
            placeholder="Např. Nezapomeň vyčistit i filtr, nebo pod gaučem..."
            aria-label="Poznámka"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>
      </div>

      {/* SUBMIT BUTTON */}
      <div className="sticky bottom-0 z-20 bg-slate-50/90 backdrop-blur-md pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <p aria-live="polite" className="mb-2 text-sm text-slate-700">
          {selectedAssigneeId
            ? `Úkol odešleme: ${people.find((person) => person.id === selectedAssigneeId)?.name}`
            : people.length === 0
            ? "Před zadáním úkolu přidej člena čety v Nastavení."
            : "Před odesláním vyber, kdo má úkol splnit."}
        </p>
        <button
          type="submit"
          disabled={isPending || !selectedAssigneeId}
          aria-busy={isPending}
          className="w-full py-4 bg-primary-700 hover:bg-primary-800 active:scale-[0.99] text-white font-black text-lg rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
        >
          {isPending ? (
            <>
              <Loader2 aria-hidden="true" className="w-5 h-5 animate-spin" />
              <span>Odesílám úkol...</span>
            </>
          ) : (
            <>
              <span>ZADAT ÚKOL</span>
              <span className="text-xl">🚀</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
