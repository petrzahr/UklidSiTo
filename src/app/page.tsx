import Link from "next/link";
import { getTaskService } from "@/services/task-service";
import { TaskCard } from "@/components/TaskCard";
import { Plus, CheckCircle2, Clock, Ban } from "lucide-react";
import { requireAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdminSession({ redirectOnUnauth: true });

  const params = await searchParams;
  const currentTab = params?.tab === "done" || params?.tab === "cancelled"
    ? params.tab
    : "open";

  const taskService = getTaskService();
  const allTasks = await taskService.getAll();

  const openTasks = allTasks.filter((t) => t.status === "OPEN");
  const doneTasks = allTasks.filter((t) => t.status === "DONE");
  const cancelledTasks = allTasks.filter((t) => t.status === "CANCELLED");

  const displayedTasks =
    currentTab === "done"
      ? doneTasks
      : currentTab === "cancelled"
      ? cancelledTasks
      : openTasks;

  return (
    <div className="space-y-6">
      {/* Top Banner / CTA */}
      <div className="bg-gradient-to-r from-primary-700 to-teal-700 rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            <span>Co je zase potřeba uklidit?</span>
          </h1>
          <p className="text-primary-100 text-sm mt-1">
            Zadej úkol, vyber oběť a systém jí pošle instrukce s odkazem.
          </p>
        </div>
        <Link
          href="/tasks/new"
          className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 bg-white hover:bg-primary-50 text-primary-800 font-extrabold px-6 py-3 rounded-xl shadow-md transition-all active:scale-95 text-base"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          NAHLÁSIT BORDEL
        </Link>
      </div>

      {/* Status filters and counts */}
      <nav aria-label="Filtrovat úkoly podle stavu" className="grid grid-cols-3 gap-2 sm:gap-3">
        <Link
          href="/?tab=open"
          aria-current={currentTab === "open" ? "page" : undefined}
          className={`min-w-0 p-3 sm:p-4 rounded-xl border transition-all ${
            currentTab === "open"
              ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex flex-col items-start sm:flex-row sm:items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            <span>Čeká na úklid</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {openTasks.length}
          </p>
        </Link>

        <Link
          href="/?tab=done"
          aria-current={currentTab === "done" ? "page" : undefined}
          className={`min-w-0 p-3 sm:p-4 rounded-xl border transition-all ${
            currentTab === "done"
              ? "bg-primary-50 border-primary-300 ring-2 ring-primary-400"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex flex-col items-start sm:flex-row sm:items-center gap-2 text-primary-700 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>Hotovo</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {doneTasks.length}
          </p>
        </Link>

        <Link
          href="/?tab=cancelled"
          aria-current={currentTab === "cancelled" ? "page" : undefined}
          className={`min-w-0 p-3 sm:p-4 rounded-xl border transition-all ${
            currentTab === "cancelled"
              ? "bg-slate-100 border-slate-300 ring-2 ring-slate-400"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex flex-col items-start sm:flex-row sm:items-center gap-2 text-slate-600 text-xs font-bold uppercase tracking-wider">
            <Ban className="w-4 h-4" />
            <span>Zrušené</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-700 mt-1">
            {cancelledTasks.length}
          </p>
        </Link>
      </nav>

      {/* Task list or Empty state */}
      {displayedTasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 px-5 py-8 sm:p-12 text-center">
          <div className="text-4xl mb-3">
            {currentTab === "open" ? "🎉" : currentTab === "done" ? "🤷" : "🕊️"}
          </div>
          <h2 className="text-lg font-bold text-slate-800">
            {currentTab === "open"
              ? "Žádný bordel nečeká!"
              : currentTab === "done"
              ? "Zatím žádné splněné úkoly."
              : "Žádné zrušené úkoly."}
          </h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            {currentTab === "open"
              ? allTasks.length === 0
                ? "Začni prvním úkolem. Vyber, co je potřeba uklidit a kdo to má udělat."
                : "Žádný úkol teď nečeká na splnění. Další můžeš zadat tlačítkem níže."
              : currentTab === "done"
              ? "Až někdo z úklidové čety potvrdí splnění, objeví se to tady."
              : "Zrušené úkoly se zobrazí tady."}
          </p>
          {currentTab === "open" && (
            <Link
              href="/tasks/new"
              className="inline-flex items-center gap-2 mt-5 bg-primary-700 hover:bg-primary-800 text-white font-bold px-5 py-2.5 rounded-xl shadow transition-all active:scale-95 text-sm"
            >
              <Plus className="w-4 h-4" />
              Nahlásit první bordel
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
