"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PlusCircle, Settings, Home, LogOut, Sparkles } from "lucide-react";
import { useState } from "react";

export function Header({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Logout failed");
      router.push("/login");
      router.refresh();
    } catch {
      setLogoutError("Odhlášení se nepodařilo. Zkontroluj připojení a zkus to znovu.");
    } finally {
      window.clearTimeout(timeout);
      setLoggingOut(false);
    }
  }

  // On public task completion page, show minimal clean header
  if (pathname.startsWith("/task/")) {
    return (
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧹</span>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                UklidSiTo
              </span>
              <span className="hidden sm:inline-block text-xs text-slate-500 ml-2">
                Domácnost se sama neuklidí.
              </span>
            </div>
          </div>
          <span className="text-xs bg-primary-50 text-primary-700 font-medium px-2.5 py-1 rounded-full border border-primary-200">
            Jednorázový odkaz
          </span>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="text-2xl group-hover:rotate-12 transition-transform">🧹</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-slate-900 tracking-tight text-xl">
                UklidSiTo
              </span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Domácnost se sama neuklidí.
            </p>
          </div>
        </Link>

        <nav aria-label="Hlavní navigace" className="flex flex-wrap items-center gap-1 sm:gap-3">
          <Link
            href="/"
            aria-label="Přehled"
            aria-current={pathname === "/" ? "page" : undefined}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              pathname === "/"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Přehled</span>
          </Link>

          <Link
            href="/tasks/new"
            aria-current={pathname === "/tasks/new" ? "page" : undefined}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-bold bg-primary-700 hover:bg-primary-800 text-white shadow-sm transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nahlásit bordel</span>
          </Link>

          <Link
            href="/settings"
            aria-label="Nastavení"
            aria-current={pathname.startsWith("/settings") ? "page" : undefined}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              pathname.startsWith("/settings")
                ? "bg-slate-100 text-slate-900"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Nastavení</span>
          </Link>

          {isLoggedIn && (
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Odhlásit se"
              aria-label="Odhlásit se"
              aria-describedby={logoutError ? "logout-error" : undefined}
              className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </nav>
        {logoutError && (
          <p id="logout-error" role="alert" className="w-full text-sm text-rose-800">
            {logoutError}
          </p>
        )}
      </div>
    </header>
  );
}
