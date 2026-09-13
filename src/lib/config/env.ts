export type AppEnvironment = "development" | "preview" | "production";

export interface AppConfig {
  env: AppEnvironment;
  isProduction: boolean;
  isTestOrDev: boolean;
  adminEmail: string;
  sheetId: string;
  googleClientId: string;
  googleClientSecret: string;
  googleServiceAccountEmail?: string;
  googlePrivateKey?: string;
  resendApiKey?: string;
  emailFrom: string;
  testEmailRecipient?: string;
  appBaseUrl: string;
  nextAuthSecret: string;
}

/**
 * Validates and resolves the centralized application configuration.
 * Strictly guarantees separation between production and development/preview data and emails.
 */
export function getAppConfig(
  overrideEnv?: Record<string, string | undefined>,
  options: { strict?: boolean } = {}
): AppConfig {
  const envSource = overrideEnv || process.env;
  const isStrict = options.strict ?? Boolean(overrideEnv);

  // APP_ENV takes absolute precedence over NODE_ENV
  const rawEnv = (envSource.APP_ENV || "development").toLowerCase().trim();

  let env: AppEnvironment;
  if (rawEnv === "production" || rawEnv === "prod") {
    env = "production";
  } else if (rawEnv === "preview") {
    env = "preview";
  } else if (rawEnv === "development" || rawEnv === "dev" || rawEnv === "test") {
    env = "development";
  } else {
    // Fail safely: If APP_ENV is invalid or ambiguous, never fall back to production
    throw new Error(
      `Invalid APP_ENV: "${rawEnv}". Allowed values are: 'development', 'preview', 'production'.`
    );
  }

  const isProduction = env === "production";
  const isTestOrDev = !isProduction;

  // Resolve spreadsheet ID safely
  const sheetIdProd = envSource.GOOGLE_SHEET_ID_PROD?.trim();
  const sheetIdTest = envSource.GOOGLE_SHEET_ID_TEST?.trim();

  let sheetId = "";
  if (isProduction) {
    if (!sheetIdProd) {
      // During build / prerender phase without runtime env vars, avoid crashing static export
      if (!isStrict) {
        sheetId = "placeholder-prod-sheet-during-build";
      } else {
        throw new Error(
          "Production configuration error: GOOGLE_SHEET_ID_PROD is required in production environment."
        );
      }
    } else {
      sheetId = sheetIdProd;
    }
  } else {
    if (!sheetIdTest) {
      if (!isStrict) {
        sheetId = "placeholder-test-sheet-during-build";
      } else {
        throw new Error(
          "Development/preview configuration error: GOOGLE_SHEET_ID_TEST is required in non-production environments. Never use production sheet for testing."
        );
      }
    } else {
      sheetId = sheetIdTest;
    }
  }

  const adminEmail = (envSource.ADMIN_EMAIL || "").trim().toLowerCase();
  const testEmailRecipient = (envSource.TEST_EMAIL_RECIPIENT || "").trim().toLowerCase();

  // In non-production, verify that if emails are sent, test email recipient is configured or handled safely
  if (isTestOrDev && !testEmailRecipient && envSource.RESEND_API_KEY) {
    console.warn(
      "[Config Warning] TEST_EMAIL_RECIPIENT is not set in non-production environment. All outgoing test emails will be logged only or blocked for safety."
    );
  }

  const appBaseUrl = (
    envSource.APP_BASE_URL ||
    (isProduction ? "https://uklidsito.byzahr.app" : "http://localhost:3000")
  ).replace(/\/$/, "");

  // Format Google Service Account private key if formatted with escaped newlines
  let googlePrivateKey = envSource.GOOGLE_PRIVATE_KEY;
  if (googlePrivateKey) {
    googlePrivateKey = googlePrivateKey.replace(/\\n/g, "\n");
  }

  return {
    env,
    isProduction,
    isTestOrDev,
    adminEmail,
    sheetId,
    googleClientId: envSource.GOOGLE_CLIENT_ID || "",
    googleClientSecret: envSource.GOOGLE_CLIENT_SECRET || "",
    googleServiceAccountEmail: envSource.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    googlePrivateKey,
    resendApiKey: envSource.RESEND_API_KEY,
    emailFrom: envSource.EMAIL_FROM || "UklidSiTo <uklid@uklidsito.byzahr.app>",
    testEmailRecipient: testEmailRecipient || undefined,
    appBaseUrl,
    nextAuthSecret: envSource.NEXTAUTH_SECRET || envSource.AUTH_SECRET || "development-insecure-secret-do-not-use-in-prod",
  };
}

let cachedConfig: AppConfig | null = null;

export function resetConfigCache(): void {
  cachedConfig = null;
}

export function getConfig(): AppConfig {
  if (!cachedConfig) {
    cachedConfig = getAppConfig();
  }
  return cachedConfig;
}
