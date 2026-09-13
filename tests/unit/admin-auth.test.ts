import { describe, it, expect, beforeEach } from "vitest";
import { authOptions } from "@/lib/auth/auth";
import { resetConfigCache } from "@/lib/config/env";

describe("Administrator Authorization", () => {
  beforeEach(() => {
    resetConfigCache();
    process.env.APP_ENV = "development";
    process.env.GOOGLE_SHEET_ID_TEST = "test-sheet-id";
    process.env.ADMIN_EMAIL = "petr@byzahr.app";
    resetConfigCache();
  });

  it("permits sign in only for ADMIN_EMAIL and rejects any other account", async () => {
    const signInCallback = authOptions.callbacks?.signIn;
    expect(signInCallback).toBeDefined();

    if (signInCallback) {
      // Authorized admin
      const allowed = await signInCallback({
        user: { id: "1", email: "petr@byzahr.app" },
        account: null,
        profile: undefined,
        email: undefined,
        credentials: undefined,
      });
      expect(allowed).toBe(true);

      // Case insensitive match
      const allowedCaps = await signInCallback({
        user: { id: "1", email: "Petr@ByZahr.App" },
        account: null,
        profile: undefined,
        email: undefined,
        credentials: undefined,
      });
      expect(allowedCaps).toBe(true);

      // Unauthorized user
      const rejected = await signInCallback({
        user: { id: "2", email: "stranger@gmail.com" },
        account: null,
        profile: undefined,
        email: undefined,
        credentials: undefined,
      });
      expect(rejected).toBe(false);

      // Household member email without admin rights
      const memberRejected = await signInCallback({
        user: { id: "3", email: "eva@example.com" },
        account: null,
        profile: undefined,
        email: undefined,
        credentials: undefined,
      });
      expect(memberRejected).toBe(false);
    }
  });
});
