"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ShieldAlert, Users, Loader2 } from "lucide-react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (element: HTMLElement, config: object) => void;
          prompt: () => void;
        };
      };
    };
  }
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;
    setLoadError(false);
    const buttonEl = document.getElementById("google-signin-btn");
    if (!buttonEl) return;
    let lastWidth = 0;
    const timeout = window.setTimeout(() => setLoadError(true), 15000);

    function renderGsiButton() {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: clientId!,
        callback: handleCredentialResponse,
        context: "signin",
        ux_mode: "popup",
      });

      if (buttonEl) {
        const width = Math.min(360, Math.floor(buttonEl.clientWidth));
        if (width <= 0 || width === lastWidth) return;
        lastWidth = width;
        buttonEl.replaceChildren();
        window.google.accounts.id.renderButton(buttonEl, {
          theme: "outline",
          size: "large",
          type: "standard",
          shape: "rectangular",
          width,
          text: "signin_with",
          logo_alignment: "left",
        });
        window.clearTimeout(timeout);
        setLoadError(false);
      }
    }

    const scriptId = "google-gsi-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    const isNew = !script;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
    }
    const handleLoadError = () => {
      window.clearTimeout(timeout);
      setLoadError(true);
    };
    script.addEventListener("load", renderGsiButton);
    script.addEventListener("error", handleLoadError);
    const observer = new ResizeObserver(renderGsiButton);
    observer.observe(buttonEl);
    if (isNew) document.head.appendChild(script);
    renderGsiButton();
    return () => {
      window.clearTimeout(timeout);
      observer.disconnect();
      script.removeEventListener("load", renderGsiButton);
      script.removeEventListener("error", handleLoadError);
    };
  }, [clientId, attempt]);

  async function handleCredentialResponse(response: { credential: string }) {
    try {
      const res = await fetch("/api/auth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        if (data.error === "unauthorized") {
          router.push("/login?error=unauthorized");
        } else {
          router.push("/login?error=failed");
        }
      }
    } catch {
      router.push("/login?error=failed");
    }
  }

  const errorMessages: Record<string, string> = {
    unauthorized: "Tento Google účet nemá přístup ke správě domácnosti. Přihlas se účtem správce.",
    failed: "Zkus se přihlásit znovu. Pokud se chyba opakuje, zkontroluj připojení a obnov stránku.",
  };

  return (
    <div className="w-full min-w-0 max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
      <div className="flex items-center gap-4">
        <div aria-hidden="true" className="w-12 h-12 shrink-0 bg-primary-100 rounded-xl flex items-center justify-center text-2xl">
          🧹
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            UklidSiTo
          </h1>
          <p className="text-sm leading-relaxed text-slate-600 mt-0.5">
            Domácnost se sama neuklidí
          </p>
        </div>
      </div>

      <div className="mt-8 mb-5">
        <h2 className="text-lg font-bold text-slate-900">Přihlášení správce</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Pokračuj účtem Google, který používáš ke správě domácnosti.
        </p>
      </div>

      {error && errorMessages[error] && (
        <div role="alert" className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-left flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-800">
            <strong className="block font-bold mb-0.5">
              {error === "unauthorized" ? "Přístup odepřen" : "Přihlášení se nezdařilo"}
            </strong>
            {errorMessages[error]}
          </div>
        </div>
      )}

      <div>
        {/* Google Identity Services rendered button */}
        {!clientId ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-900">
            <strong>Chybí konfigurace:</strong> Není nastavena proměnná prostředí{" "}
            <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>.
          </div>
        ) : (
          <div className="space-y-3">
            <div id="google-signin-btn" className="w-full min-h-[44px] flex justify-center" />
            {loadError && (
              <div role="alert" className="text-sm text-rose-800">
                <p>Přihlášení se nepodařilo načíst. Zkontroluj připojení a zkus to znovu.</p>
                <button type="button" className="mt-2 px-4 py-2 rounded-lg bg-slate-900 text-white font-bold"
                  onClick={() => {
                    document.getElementById("google-gsi-script")?.remove();
                    setAttempt((value) => value + 1);
                  }}>
                  Načíst znovu
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-7 pt-5 border-t border-slate-100 flex items-start gap-3">
        <Users aria-hidden="true" className="w-4 h-4 shrink-0 mt-0.5 text-slate-500" />
        <p className="text-xs leading-relaxed text-slate-600">
          Úklidová četa se nepřihlašuje. Úkoly potvrzují přes odkaz v e-mailu.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[65vh] flex items-center justify-center py-6 sm:py-10">
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-700" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
