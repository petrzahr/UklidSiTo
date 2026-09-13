import { google, sheets_v4 } from "googleapis";
import { getConfig } from "@/lib/config/env";

let sheetsInstance: sheets_v4.Sheets | null = null;

export function getGoogleSheetsClient(): sheets_v4.Sheets {
  if (sheetsInstance) return sheetsInstance;

  const config = getConfig();

  if (!config.googleServiceAccountEmail || !config.googlePrivateKey) {
    throw new Error(
      "Missing Google Service Account credentials. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY."
    );
  }

  const auth = new google.auth.JWT({
    email: config.googleServiceAccountEmail,
    key: config.googlePrivateKey,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.readonly",
    ],
  });

  sheetsInstance = google.sheets({ version: "v4", auth });
  return sheetsInstance;
}
