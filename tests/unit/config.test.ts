import { describe, it, expect } from "vitest";
import { getAppConfig } from "@/lib/config/env";

describe("Centralized Environment Configuration", () => {
  it("resolves production configuration correctly", () => {
    const config = getAppConfig({
      APP_ENV: "production",
      GOOGLE_SHEET_ID_PROD: "prod-sheet-12345",
      GOOGLE_SHEET_ID_TEST: "test-sheet-67890",
      ADMIN_EMAIL: "admin@example.com",
    });

    expect(config.env).toBe("production");
    expect(config.isProduction).toBe(true);
    expect(config.isTestOrDev).toBe(false);
    expect(config.sheetId).toBe("prod-sheet-12345");
  });

  it("resolves development and preview to test sheet", () => {
    const devConfig = getAppConfig({
      APP_ENV: "development",
      GOOGLE_SHEET_ID_PROD: "prod-sheet-12345",
      GOOGLE_SHEET_ID_TEST: "test-sheet-67890",
      ADMIN_EMAIL: "admin@example.com",
    });

    expect(devConfig.env).toBe("development");
    expect(devConfig.isProduction).toBe(false);
    expect(devConfig.isTestOrDev).toBe(true);
    expect(devConfig.sheetId).toBe("test-sheet-67890");

    const previewConfig = getAppConfig({
      APP_ENV: "preview",
      GOOGLE_SHEET_ID_PROD: "prod-sheet-12345",
      GOOGLE_SHEET_ID_TEST: "test-sheet-67890",
      ADMIN_EMAIL: "admin@example.com",
    });

    expect(previewConfig.env).toBe("preview");
    expect(previewConfig.sheetId).toBe("test-sheet-67890");
  });

  it("fails safely if APP_ENV is invalid or ambiguous and NEVER uses production sheet", () => {
    expect(() =>
      getAppConfig({
        APP_ENV: "staging-invalid",
        GOOGLE_SHEET_ID_PROD: "prod-sheet-12345",
        GOOGLE_SHEET_ID_TEST: "test-sheet-67890",
      })
    ).toThrowError(/Invalid APP_ENV/);
  });

  it("fails safely if production sheet is missing in production", () => {
    expect(() =>
      getAppConfig({
        APP_ENV: "production",
        GOOGLE_SHEET_ID_TEST: "test-sheet-67890",
      })
    ).toThrowError(/GOOGLE_SHEET_ID_PROD is required in production/);
  });

  it("fails safely if test sheet is missing in non-production, NEVER falling back to production", () => {
    expect(() =>
      getAppConfig({
        APP_ENV: "development",
        GOOGLE_SHEET_ID_PROD: "prod-sheet-12345",
      })
    ).toThrowError(/GOOGLE_SHEET_ID_TEST is required in non-production/);
  });
});
