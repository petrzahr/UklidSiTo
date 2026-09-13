import { OAuth2Client } from "google-auth-library";
import { getConfig } from "@/lib/config/env";

let client: OAuth2Client | null = null;

export function getGoogleAuthClient(): OAuth2Client {
  if (!client) {
    const config = getConfig();
    client = new OAuth2Client(config.googleClientId);
  }
  return client;
}

/**
 * Verifies a Google ID token and returns the verified email.
 * Uses google-auth-library — no GOOGLE_CLIENT_SECRET needed.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<string> {
  const config = getConfig();
  const googleClient = getGoogleAuthClient();

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: config.googleClientId,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error("Token payload is empty.");
  }

  const email = payload.email;
  if (!email) {
    throw new Error("No email in Google ID token.");
  }

  if (!payload.email_verified) {
    throw new Error("Google account email is not verified.");
  }

  return email.toLowerCase().trim();
}
