import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getConfig } from "@/lib/config/env";

export const SESSION_COOKIE_NAME = "uklidsito_session";

/** Minimum session payload stored in the cookie value (signed, not encrypted – use SESSION_SECRET). */
export interface SessionPayload {
  email: string;
  /** Unix timestamp (seconds) */
  expiresAt: number;
}

const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

// ---------------------------------------------------------------------------
// Signing helpers – HMAC-SHA256 via Web Crypto (available in Edge & Node)
// ---------------------------------------------------------------------------

async function importKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Buffer.from(sig).toString("base64url");
}

async function verify(payload: string, signature: string, secret: string): Promise<boolean> {
  const key = await importKey(secret);
  const sigBuf = Buffer.from(signature, "base64url");
  return crypto.subtle.verify("HMAC", key, sigBuf, new TextEncoder().encode(payload));
}

// ---------------------------------------------------------------------------
// Cookie value format: base64(json).<hmac-signature>
// ---------------------------------------------------------------------------

function getSessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    if (process.env.APP_ENV === "production" || process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET is required in production (min 32 chars).");
    }
    return "dev-insecure-session-secret-uklidsito-local";
  }
  return s;
}

export async function createSession(email: string): Promise<string> {
  const payload: SessionPayload = {
    email,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = await sign(payloadB64, getSessionSecret());
  return `${payloadB64}.${sig}`;
}

export async function parseSession(cookieValue: string): Promise<SessionPayload | null> {
  try {
    const [payloadB64, sig] = cookieValue.split(".");
    if (!payloadB64 || !sig) return null;

    const valid = await verify(payloadB64, sig, getSessionSecret());
    if (!valid) return null;

    const payload: SessionPayload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));

    if (Math.floor(Date.now() / 1000) > payload.expiresAt) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Server-side session helpers for use in Server Components / Route Handlers
// ---------------------------------------------------------------------------

/**
 * Reads and validates the session from the request cookie.
 * Returns the session payload or null.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!cookie) return null;
  return parseSession(cookie.value);
}

/**
 * Guards a server component or action. If no valid admin session exists:
 * - redirects to /login for page routes (never throws)
 * - throws an Unauthorized error for API/action routes
 */
export async function requireAdminSession(
  options: { redirectOnUnauth?: boolean } = { redirectOnUnauth: false }
): Promise<SessionPayload> {
  const session = await getSession();
  const config = getConfig();

  if (!session) {
    if (options.redirectOnUnauth) {
      redirect("/login");
    }
    throw new Error("Unauthorized: Přihlášení vyžadováno.");
  }

  if (session.email.toLowerCase() !== config.adminEmail.toLowerCase()) {
    if (options.redirectOnUnauth) {
      redirect("/login?error=unauthorized");
    }
    throw new Error("Forbidden: Tento účet nemá přístup k aplikaci.");
  }

  return session;
}

/**
 * Sets the secure session cookie on the response.
 * Must be called in a Route Handler (not a Server Action directly).
 */
export async function setSessionCookie(email: string): Promise<void> {
  const value = await createSession(email);
  const cookieStore = await cookies();
  const isProduction = process.env.APP_ENV === "production" || process.env.NODE_ENV === "production";

  cookieStore.set(SESSION_COOKIE_NAME, value, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

/**
 * Clears the session cookie (logout).
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  const isProduction = process.env.APP_ENV === "production" || process.env.NODE_ENV === "production";
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
