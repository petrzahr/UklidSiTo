"use client";

import { Person, Room, TaskPreset } from "@/types";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTaskAction } from "@/app/actions/task-actions";
import { Check, Sparkles, User, ArrowLeft, Clock, X } from "lucide-react";
import Link from "next/link";

interface Props {
  people: Person[];
  presets: TaskPreset[];
  rooms: Room[];
}

export function TaskCreationForm({ people, presets, rooms }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Selected state
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [taskName, setTaskName] = useState<string>("");
  const [isCustomTask, setIsCustomTask] = useState(false);
  const [saveAsPreset, setSaveAsPreset] = useState(false);

  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>(
    people[0]?.id || ""
  );

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string>("");
  const [isCustomRoom, setIsCustomRoom] = useState(false);
  const [saveAsRoomPreset, setSaveAsRoomPreset] = useState(false);

  const [note, setNote] = useState<string>("");
  const [deadline, setDeadline] = useState<string>("");

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
      setErrorMessage("Vyberte úkol ze seznamu nebo zadejte vlastní úkol.");
      return;
    }

    if (!selectedAssigneeId) {
      setErrorMessage("Vyberte, kdo z úklidové čety má úkol splnit.");
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
          setSubmittedMessage(`✅ Pachatel byl informován. (${person?.name || "Řešitel"})`);
        }
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error ? err.message : "Chyba při ukládání úkolu."
        );
      }
    });
  };

  const handleResetForm = () => {
    setSelectedPresetId(null);
    setTaskName("");
    setIsCustomTask(false);
    setSaveAsPreset(false);
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
      <div className="relative bg-white rounded-3xl border border-emerald-200 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-xl animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={() => router.push("/")}
          title="Zavřít"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Zavřít"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-6xl mb-4">🫡</div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">
          {submittedMessage}
        </h2>
        <p className="text-sm text-slate-500 mb-8">
          E-mail s instrukcemi a potvrzovacím tlačítkem je na cestě.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 text-sm"
          >
            Zavřít
          </button>
          <button
            type="button"
            onClick={handleResetForm}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200 transition-all active:scale-95 text-sm"
          >
            Nahlásit další bordel
          </button>
        </div>
      </div>
    );
  }

  // Quick deadline buttons
  const quickDeadlines = ["Dnes", "Dnes večer", "Zítra", "Do pátku", "O víkendu"];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Zpět na přehled
        </Link>
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
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
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold rounded-xl">
          {errorMessage}
        </div>
      )}

      {/* STEP 1: TASK SELECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <span className="w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px]">
              1
            </span>
            <span>Co je potřeba udělat?</span>
          </label>
        </div>

        {/* Presets grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {presets.slice(0, 11).map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                type="button"
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all active:scale-95 ${
                  isSelected
                    ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold shadow-sm"
                    : "bg-slate-50/70 hover:bg-slate-100 border-slate-200 text-slate-800 font-medium"
                }`}
              >
                <span className="text-xl shrink-0">{preset.icon || "✨"}</span>
                <span className="text-xs sm:text-sm leading-tight line-clamp-2">
                  {preset.name}
                </span>
              </button>
            );
          })}

          {/* Custom Task Button */}
          <button
            type="button"
            onClick={handleSelectCustomTask}
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
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
              autoFocus
            />
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={saveAsPreset}
                onChange={(e) => setSaveAsPreset(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span>Uložit tento úkol do přednastavených</span>
            </label>
          </div>
        )}
      </div>

      {/* STEP 2: ASSIGNEE SELECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <span className="w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px]">
            2
          </span>
          <span>Kdo to schytá?</span>
        </label>

        <div className="grid grid-cols-2 gap-3">
          {people.map((person) => {
            const isSelected = selectedAssigneeId === person.id;
            return (
              <button
                type="button"
                key={person.id}
                onClick={() => setSelectedAssigneeId(person.id)}
                className={`p-4 rounded-xl border flex items-center gap-3 transition-all active:scale-95 ${
                  isSelected
                    ? "bg-emerald-600 text-white border-emerald-700 shadow-md ring-4 ring-emerald-500/20"
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
                <div className="text-left overflow-hidden">
                  <p className="font-extrabold text-base leading-tight truncate">
                    {person.name}
                  </p>
                  <p
                    className={`text-[11px] truncate ${
                      isSelected ? "text-emerald-100" : "text-slate-400"
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
        <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <span className="w-5 h-5 bg-slate-400 text-white rounded-full flex items-center justify-center text-[10px]">
            3
          </span>
          <span>Detaily (volitelné)</span>
        </label>

        {/* Room selection */}
        <div>
          <span className="block text-xs font-bold text-slate-700 mb-2">
            Místnost
          </span>
          <div className="flex flex-wrap gap-2">
            {rooms.map((room) => {
              const isSelected = selectedRoomId === room.id;
              return (
                <button
                  type="button"
                  key={room.id}
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border border-dashed transition-colors ${
                isCustomRoom
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100"
              }`}
            >
              Jiná...
            </button>
          </div>

          {isCustomRoom && (
            <div className="mt-2 space-y-2">
              <input
                type="text"
                placeholder="Název místnosti..."
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAsRoomPreset}
                  onChange={(e) => setSaveAsRoomPreset(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-emerald-600"
                />
                <span>Uložit místnost do přednastavených</span>
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
            {quickDeadlines.map((qd) => (
              <button
                type="button"
                key={qd}
                onClick={() => setDeadline(qd)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                  deadline === qd
                    ? "bg-rose-50 border-rose-400 text-rose-700 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {qd}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Nebo zadej vlastní termín (např. do 18:00)..."
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>
      </div>

      {/* SUBMIT BUTTON */}
      <div className="sticky bottom-4 z-20 bg-slate-50/90 backdrop-blur-md pt-2 pb-1">
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-lg rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Clock className="w-5 h-5 animate-spin" />
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
