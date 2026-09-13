import { NextRequest, NextResponse } from "next/server";
import { verifyGoogleIdToken } from "@/lib/auth/google";
import { setSessionCookie } from "@/lib/auth/session";
import { getConfig } from "@/lib/config/env";

/**
 * POST /api/auth/callback
 * Body: { credential: "<Google ID token>" }
 *
 * Verifies the Google ID token, checks ADMIN_EMAIL, creates a signed session cookie.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const idToken = body?.credential;

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ error: "Missing credential token." }, { status: 400 });
    }

    let email: string;
    try {
      email = await verifyGoogleIdToken(idToken);
    } catch (e: unknown) {
      console.error("[Auth] Token verification failed:", e instanceof Error ? e.message : e);
      return NextResponse.json({ error: "Invalid Google token." }, { status: 401 });
    }

    const config = getConfig();
    if (!config.adminEmail) {
      console.error("[Auth] ADMIN_EMAIL is not configured.");
      return NextResponse.json({ error: "Server misconfiguration." }, { status: 500 });
    }

    if (email !== config.adminEmail.toLowerCase()) {
      console.warn(`[Auth] Unauthorized login attempt from ${email}. Only ${config.adminEmail} is permitted.`);
      return NextResponse.json({ error: "unauthorized" }, { status: 403 });
    }

    // Create and set secure session cookie
    await setSessionCookie(email);

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("[Auth] Unexpected error:", e);
    return NextResponse.json({ error: "Authentication failed." }, { status: 500 });
  }
}
