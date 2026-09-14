import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "UklidSiTo – Domácnost sama se neuklidí",
  description:
    "Jednoduchá soukromá aplikace pro správu úklidových úkolů v domácnosti s humornou osobností.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧹</text></svg>",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const isLoggedIn = !!session;

  return (
    <html lang="cs">
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Header isLoggedIn={isLoggedIn} />
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">
          {children}
        </main>
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          <p>🧹 <strong>UklidSiTo</strong> • Domácnost sama se neuklidí.</p>
        </footer>
      </body>
    </html>
  );
}
