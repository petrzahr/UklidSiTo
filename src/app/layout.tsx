import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "UklidSiTo – Domácnost se sama neuklidí",
  description:
    "Jednoduchá soukromá aplikace pro správu úklidových úkolů v domácnosti s humornou osobností.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
        <a href="#main-content" className="skip-link">Přejít na obsah</a>
        <Header isLoggedIn={isLoggedIn} />
        <main id="main-content" className="flex-1 min-w-0 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {children}
        </main>
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-600">
          <p>🧹 <strong>UklidSiTo</strong> • Domácnost se sama neuklidí.</p>
        </footer>
      </body>
    </html>
  );
}
