import { describe, it, expect } from "vitest";
import {
  generateCompletionToken,
  hashCompletionToken,
  verifyCompletionToken,
} from "@/lib/security/token";

describe("Token Security & Cryptography", () => {
  it("generates a random 64-character hex string", () => {
    const token1 = generateCompletionToken();
    const token2 = generateCompletionToken();

    expect(token1).toHaveLength(64);
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
  });

  it("produces deterministic SHA-256 hash", () => {
    const token = "a7c645b2f1d9e8";
    const hash1 = hashCompletionToken(token);
    const hash2 = hashCompletionToken(token);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it("timing-safe verifies valid tokens and rejects invalid tokens", () => {
    const token = generateCompletionToken();
    const storedHash = hashCompletionToken(token);

    expect(verifyCompletionToken(token, storedHash)).toBe(true);
    expect(verifyCompletionToken("wrong-token", storedHash)).toBe(false);
    expect(verifyCompletionToken("", storedHash)).toBe(false);
  });
});
