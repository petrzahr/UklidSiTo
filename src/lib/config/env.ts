export interface AppConfig {
  adminEmail: string;
  sheetId: string;
  /** Public Google OAuth client ID – used by Google Identity Services on the frontend */
  googleClientId: string;
  googleServiceAccountEmail?: string;
  googlePrivateKey?: string;
  resendApiKey?: string;
  emailFrom: string;
  appBaseUrl: string;
}

/**
 * Validates and resolves the centralized application configuration.
 * Uses the production spreadsheet and email configuration.
 */
export function getAppConfig(
  overrideEnv?: Record<string, string | undefined>,
  options: { strict?: boolean } = {}
): AppConfig {
  const envSource = overrideEnv || process.env;
  const isStrict = options.strict ?? Boolean(overrideEnv);

  const sheetIdProd = envSource.GOOGLE_SHEET_ID_PROD?.trim();
  const sheetId = sheetIdProd || "placeholder-prod-sheet-during-build";
  if (!sheetIdProd && isStrict) {
    throw new Error(
      "Production configuration error: GOOGLE_SHEET_ID_PROD is required in production environment."
    );
  }

  const adminEmail = (envSource.ADMIN_EMAIL || "").trim().toLowerCase();
  const appBaseUrl = (
    envSource.APP_BASE_URL ||
    "https://uklidsito.byzahr.app"
  ).replace(/\/$/, "");

  // Format Google Service Account private key if formatted with escaped newlines
  let googlePrivateKey = envSource.GOOGLE_PRIVATE_KEY;
  if (googlePrivateKey) {
    googlePrivateKey = googlePrivateKey.replace(/\\n/g, "\n");
  }

  return {
    adminEmail,
    sheetId,
    googleClientId:
      envSource.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      envSource.GOOGLE_CLIENT_ID ||
      "",
    googleServiceAccountEmail: envSource.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    googlePrivateKey,
    resendApiKey: envSource.RESEND_API_KEY,
    emailFrom: envSource.EMAIL_FROM || "UklidSiTo <uklid@uklidsito.byzahr.app>",
    appBaseUrl,
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
