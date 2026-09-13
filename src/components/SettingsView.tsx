"use client";

import { Person, Room, TaskPreset } from "@/types";
import { useState, useTransition } from "react";
import {
  createPersonAction,
  updatePersonAction,
  createPresetAction,
  updatePresetAction,
  createRoomAction,
  updateRoomAction,
  bootstrapStoreAction,
} from "@/app/actions/settings-actions";
import {
  Users,
  CheckSquare,
  Home,
  Database,
  Plus,
  Edit2,
  Check,
  X,
  Power,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

interface Props {
  people: Person[];
  presets: TaskPreset[];
  rooms: Room[];
  systemInfo: {
    env: string;
    isProduction: boolean;
    maskedSheetId: string;
    storageType: string;
    testEmailRecipient?: string;
    adminEmail: string;
  };
}

export function SettingsView({ people, presets, rooms, systemInfo }: Props) {
  const [activeTab, setActiveTab] = useState<"people" | "presets" | "rooms" | "system">("people");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  // New person form state
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonEmail, setNewPersonEmail] = useState("");
  const [newPersonEmoji, setNewPersonEmoji] = useState("👤");

  // New preset form state
  const [showAddPreset, setShowAddPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetCat, setNewPresetCat] = useState<TaskPreset["category"]>("General");
  const [newPresetIcon, setNewPresetIcon] = useState("🧹");

  // New room form state
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");

  const handleCreatePerson = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createPersonAction({
          name: newPersonName,
          email: newPersonEmail,
          emoji: newPersonEmoji,
          active: true,
        });
        setNewPersonName("");
        setNewPersonEmail("");
        setShowAddPerson(false);
        setFeedback("Člen byl úspěšně přidán.");
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Chyba při vytváření");
      }
    });
  };

  const handleTogglePerson = (person: Person) => {
    startTransition(async () => {
      try {
        await updatePersonAction(person.id, { active: !person.active });
        setFeedback(`Člen ${person.name} byl ${!person.active ? "aktivován" : "deaktivován"}.`);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Chyba");
      }
    });
  };

  const handleCreatePreset = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createPresetAction({
          name: newPresetName,
          category: newPresetCat,
          icon: newPresetIcon,
          active: true,
          sortOrder: presets.length + 1,
        });
        setNewPresetName("");
        setShowAddPreset(false);
        setFeedback("Předvolba byla úspěšně vytvořena.");
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Chyba");
      }
    });
  };

  const handleTogglePreset = (preset: TaskPreset) => {
    startTransition(async () => {
      try {
        await updatePresetAction(preset.id, { active: !preset.active });
        setFeedback(`Předvolba "${preset.name}" byla upravena.`);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Chyba");
      }
    });
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createRoomAction({
          name: newRoomName,
          active: true,
          sortOrder: rooms.length + 1,
        });
        setNewRoomName("");
        setShowAddRoom(false);
        setFeedback("Místnost byla úspěšně přidána.");
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Chyba");
      }
    });
  };

  const handleToggleRoom = (room: Room) => {
    startTransition(async () => {
      try {
        await updateRoomAction(room.id, { active: !room.active });
        setFeedback(`Místnost "${room.name}" byla upravena.`);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Chyba");
      }
    });
  };

  const handleBootstrap = () => {
    if (confirm("Chcete inicializovat / ověřit záložky a hlavičky tabulky?")) {
      startTransition(async () => {
        try {
          const res = await bootstrapStoreAction();
          setFeedback(res.message);
        } catch (err: unknown) {
          alert(err instanceof Error ? err.message : "Chyba při inicializaci");
        }
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Nastavení aplikace ⚙️
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Správa úklidové čety, předvoleb úkolů, místností a systémových informací.
        </p>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("people")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === "people"
              ? "bg-slate-900 text-white shadow"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Úklidová četa ({people.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("presets")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === "presets"
              ? "bg-slate-900 text-white shadow"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Úkoly ({presets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("rooms")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === "rooms"
              ? "bg-slate-900 text-white shadow"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Místnosti ({rooms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("system")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === "system"
              ? "bg-slate-900 text-white shadow"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Systém</span>
        </button>
      </div>

      {/* TAB 1: ÚKLIDOVÁ ČETA */}
      {activeTab === "people" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Členové úklidové čety se nepřihlašují. Úkoly dostávají e-mailem s jednorázovým odkazem.
            </p>
            <button
              onClick={() => setShowAddPerson(!showAddPerson)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Přidat člena</span>
            </button>
          </div>

          {showAddPerson && (
            <form
              onSubmit={handleCreatePerson}
              className="bg-white p-4 rounded-xl border border-emerald-300 shadow-sm space-y-3 animate-in fade-in duration-150"
            >
              <h3 className="text-sm font-bold text-slate-800">Nový člen čety</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Jméno (např. Eva)"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="email"
                  required
                  placeholder="E-mail"
                  value={newPersonEmail}
                  onChange={(e) => setNewPersonEmail(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Emoji (👩)"
                    value={newPersonEmoji}
                    onChange={(e) => setNewPersonEmoji(e.target.value)}
                    className="w-16 px-3 py-2 border rounded-lg text-xs outline-none text-center"
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 bg-emerald-600 text-white font-bold rounded-lg text-xs hover:bg-emerald-700"
                  >
                    Uložit
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {people.map((person) => (
              <div
                key={person.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{person.emoji || "👤"}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {person.name}
                      </span>
                      {!person.active && (
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                          Neaktivní
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">{person.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePerson(person)}
                    disabled={isPending}
                    title={person.active ? "Deaktivovat člena" : "Aktivovat člena"}
                    className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      person.active
                        ? "text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                        : "text-emerald-600 hover:bg-emerald-50"
                    }`}
                  >
                    <Power className="w-4 h-4" />
                    <span>{person.active ? "Deaktivovat" : "Aktivovat"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ÚKOLY (PRESETS) */}
      {activeTab === "presets" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Přednastavené úkoly pro rychlý výběr jedním kliknutím.
            </p>
            <button
              onClick={() => setShowAddPreset(!showAddPreset)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Přidat úkol</span>
            </button>
          </div>

          {showAddPreset && (
            <form
              onSubmit={handleCreatePreset}
              className="bg-white p-4 rounded-xl border border-emerald-300 shadow-sm space-y-3"
            >
              <h3 className="text-sm font-bold text-slate-800">Nová předvolba</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Název (např. Otřít stůl)"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500 sm:col-span-2"
                />
                <select
                  value={newPresetCat}
                  onChange={(e) => setNewPresetCat(e.target.value as TaskPreset["category"])}
                  className="px-3 py-2 border rounded-lg text-xs outline-none bg-white"
                >
                  <option value="Kitchen">Kitchen</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Bathroom">Bathroom</option>
                  <option value="Waste">Waste</option>
                  <option value="Laundry">Laundry</option>
                  <option value="General">General</option>
                </select>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ikona"
                    value={newPresetIcon}
                    onChange={(e) => setNewPresetIcon(e.target.value)}
                    className="w-16 px-3 py-2 border rounded-lg text-xs outline-none text-center"
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 bg-emerald-600 text-white font-bold rounded-lg text-xs hover:bg-emerald-700"
                  >
                    Uložit
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{preset.icon || "✨"}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {preset.name}
                      </span>
                      {!preset.active && (
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                          Skryto
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">{preset.category}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleTogglePreset(preset)}
                  disabled={isPending}
                  className={`p-1.5 rounded-lg text-xs font-semibold ${
                    preset.active ? "text-slate-400 hover:text-amber-600" : "text-emerald-600"
                  }`}
                  title={preset.active ? "Skrýt předvolbu" : "Zobrazit předvolbu"}
                >
                  <Power className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MÍSTNOSTI */}
      {activeTab === "rooms" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Místnosti jsou při zadávání úkolu vždy volitelné.
            </p>
            <button
              onClick={() => setShowAddRoom(!showAddRoom)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Přidat místnost</span>
            </button>
          </div>

          {showAddRoom && (
            <form
              onSubmit={handleCreateRoom}
              className="bg-white p-4 rounded-xl border border-emerald-300 shadow-sm space-y-3"
            >
              <h3 className="text-sm font-bold text-slate-800">Nová místnost</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Název (např. Dětský pokoj)"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 bg-emerald-600 text-white font-bold rounded-lg text-xs hover:bg-emerald-700"
                >
                  Uložit
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🏠</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {room.name}
                  </span>
                  {!room.active && (
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                      Skryto
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleToggleRoom(room)}
                  disabled={isPending}
                  className={`p-1.5 rounded-lg text-xs font-semibold ${
                    room.active ? "text-slate-400 hover:text-amber-600" : "text-emerald-600"
                  }`}
                  title={room.active ? "Skrýt místnost" : "Zobrazit místnost"}
                >
                  <Power className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SYSTÉM & PROSTŘEDÍ */}
      {activeTab === "system" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Izolace prostředí a úložiště</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Informace o běhovém prostředí bez vyzrazení citlivých klíčů.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-medium block mb-1">
                Aktivní prostředí (APP_ENV)
              </span>
              <span className="font-mono font-bold text-sm text-slate-900 uppercase">
                {systemInfo.env}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                {systemInfo.isProduction
                  ? "Produkční režim. Používá produkční tabulku a skutečné e-maily příjemců."
                  : "Neprodukční režim. Data jsou striktně oddělena a e-maily přesměrovány."}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-medium block mb-1">
                Typ datového úložiště
              </span>
              <span className="font-mono font-bold text-sm text-slate-900">
                {systemInfo.storageType}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Tabulka: {systemInfo.maskedSheetId}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-medium block mb-1">
                Správce (ADMIN_EMAIL)
              </span>
              <span className="font-mono font-bold text-sm text-slate-900">
                {systemInfo.adminEmail || "Nenastaveno"}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-medium block mb-1">
                Příjemce testovacích e-mailů
              </span>
              <span className="font-mono font-bold text-sm text-slate-900">
                {systemInfo.testEmailRecipient || "Pouze simulace v konzoli"}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              <strong className="block text-slate-700 font-semibold mb-0.5">
                Inicializace tabulky (Idempotentní)
              </strong>
              Vytvoří chybějící záložky a hlavičky sloupců v Google tabulce.
            </div>

            <button
              onClick={handleBootstrap}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Inicializovat tabulku</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
