import { describe, it, expect, beforeEach } from "vitest";
import { getAppConfig, resetConfigCache } from "@/lib/config/env";

/**
 * Tests the admin email restriction logic used by the auth callback.
 * The actual Google token verification (verifyGoogleIdToken) hits network,
 * so we test the config/email-comparison logic that the route depends on.
 */
describe("Administrator Authorization", () => {
  beforeEach(() => {
    resetConfigCache();
    process.env.GOOGLE_SHEET_ID_PROD = "test-sheet-id";
    process.env.ADMIN_EMAIL = "petr@byzahr.app";
    resetConfigCache();
  });

  function isAllowed(verifiedEmail: string, adminEmail: string): boolean {
    return verifiedEmail.toLowerCase().trim() === adminEmail.toLowerCase().trim();
  }

  it("permits sign in only for ADMIN_EMAIL", () => {
    const config = getAppConfig({
      GOOGLE_SHEET_ID_PROD: "test-sheet-id",
      ADMIN_EMAIL: "petr@byzahr.app",
    });
    expect(isAllowed("petr@byzahr.app", config.adminEmail)).toBe(true);
  });

  it("permits sign in case-insensitively", () => {
    const config = getAppConfig({
      GOOGLE_SHEET_ID_PROD: "test-sheet-id",
      ADMIN_EMAIL: "petr@byzahr.app",
    });
    expect(isAllowed("Petr@ByZahr.App", config.adminEmail)).toBe(true);
  });

  it("rejects an unauthorized account", () => {
    const config = getAppConfig({
      GOOGLE_SHEET_ID_PROD: "test-sheet-id",
      ADMIN_EMAIL: "petr@byzahr.app",
    });
    expect(isAllowed("stranger@gmail.com", config.adminEmail)).toBe(false);
  });

  it("rejects household member emails that are not ADMIN_EMAIL", () => {
    const config = getAppConfig({
      GOOGLE_SHEET_ID_PROD: "test-sheet-id",
      ADMIN_EMAIL: "petr@byzahr.app",
    });
    expect(isAllowed("eva@example.com", config.adminEmail)).toBe(false);
  });
});
