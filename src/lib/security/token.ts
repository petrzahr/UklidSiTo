import crypto from "crypto";

/**
 * Generates a cryptographically strong random completion token.
 * Default 32 bytes yields 64 hex characters.
 */
export function generateCompletionToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Computes SHA-256 hash of a completion token for safe storage in the spreadsheet.
 * Raw tokens must NEVER be stored in the database or logged.
 */
export function hashCompletionToken(token: string): string {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

/**
 * Constant-time comparison of a token against a stored SHA-256 hash.
 * Prevents timing attacks.
 */
export function verifyCompletionToken(token: string, storedHash: string): boolean {
  if (!token || !storedHash) return false;
  const computedHash = hashCompletionToken(token);
  if (computedHash.length !== storedHash.length) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, "utf-8"),
      Buffer.from(storedHash, "utf-8")
    );
  } catch {
    return false;
  }
}
