import { describe, it, expect } from "vitest";
import { getAppConfig } from "@/lib/config/env";

describe("Production Configuration", () => {
  it("preserves production defaults without an environment selector", () => {
    const config = getAppConfig({
      GOOGLE_SHEET_ID_PROD: "prod-sheet-12345",
      ADMIN_EMAIL: " Admin@Example.com ",
    });
    expect(config.sheetId).toBe("prod-sheet-12345");
    expect(config.adminEmail).toBe("admin@example.com");
    expect(config.appBaseUrl).toBe("https://uklidsito.byzahr.app");
    expect(config.emailFrom).toBe("UklidSiTo <uklid@uklidsito.byzahr.app>");
  });

  it("requires the production sheet in strict mode", () => {
    expect(() => getAppConfig({})).toThrowError(/GOOGLE_SHEET_ID_PROD is required in production/);
  });

  it("preserves the production build placeholder", () => {
    expect(getAppConfig({}, { strict: false }).sheetId).toBe("placeholder-prod-sheet-during-build");
  });

  it("preserves configured production values and normalization", () => {
    const config = getAppConfig({
      GOOGLE_SHEET_ID_PROD: " prod-sheet-12345 ",
      APP_BASE_URL: "https://example.com/",
      EMAIL_FROM: "Household <tasks@example.com>",
      GOOGLE_CLIENT_ID: "server-client",
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: "public-client",
      GOOGLE_SERVICE_ACCOUNT_EMAIL: "service@example.com",
      GOOGLE_PRIVATE_KEY: "line1\\nline2",
      RESEND_API_KEY: "configured-key",
    });
    expect(config.sheetId).toBe("prod-sheet-12345");
    expect(config.appBaseUrl).toBe("https://example.com");
    expect(config.emailFrom).toBe("Household <tasks@example.com>");
    expect(config.googleClientId).toBe("public-client");
    expect(config.googleServiceAccountEmail).toBe("service@example.com");
    expect(config.googlePrivateKey).toBe("line1\nline2");
    expect(config.resendApiKey).toBe("configured-key");
  });
});
