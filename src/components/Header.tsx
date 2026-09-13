"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { PlusCircle, Settings, Home, LogOut, Sparkles } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // On public task completion page, show minimal clean header
  if (pathname.startsWith("/task/")) {
    return (
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧹</span>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                UklidSiTo
              </span>
              <span className="hidden sm:inline-block text-xs text-slate-500 ml-2">
                Domácnost sama se neuklidí.
              </span>
            </div>
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-700 font-medium px-2.5 py-1 rounded-full border border-emerald-200">
            Jednorázový odkaz
          </span>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
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
              Domácnost sama se neuklidí.
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
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
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nahlásit bordel</span>
          </Link>

          <Link
            href="/settings"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              pathname.startsWith("/settings")
                ? "bg-slate-100 text-slate-900"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Nastavení</span>
          </Link>

          {session?.user && (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Odhlásit se"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
