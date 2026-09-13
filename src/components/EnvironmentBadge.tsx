import { getConfig } from "@/lib/config/env";

export function EnvironmentBadge() {
  const config = getConfig();

  // Production must NOT display this badge
  if (config.isProduction) {
    return null;
  }

  const label = config.env === "preview" ? "PREVIEW / TEST" : "DEV (TEST DATA)";

  return (
    <div className="bg-amber-500 text-slate-950 font-bold px-3 py-1 text-xs sm:text-sm flex items-center justify-between shadow-inner">
      <div className="flex items-center gap-2 mx-auto max-w-5xl w-full px-4 justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-slate-900 text-amber-400 px-2 py-0.5 rounded text-xs font-mono font-extrabold tracking-wider">
            {config.env.toUpperCase()}
          </span>
          <span>
            Testovací režim: data se ukládají do testovací tabulky a e-maily jsou přesměrovány.
          </span>
        </div>
        {config.testEmailRecipient && (
          <span className="hidden md:inline-block text-xs font-mono opacity-90">
            Příjemce testu: {config.testEmailRecipient}
          </span>
        )}
      </div>
    </div>
  );
}
