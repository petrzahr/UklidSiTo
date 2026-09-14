import { getConfig } from "@/lib/config/env";
import { IDataStore } from "./interfaces";
import { GoogleSheetsDataStore } from "./google-sheets/sheets-repository";
import { MemoryDataStore } from "./memory-store";

let dataStoreInstance: IDataStore | null = null;

export function getDataStore(): IDataStore {
  if (dataStoreInstance) return dataStoreInstance;

  const config = getConfig();

  // If Google Service Account credentials and Sheet ID are provided, use Google Sheets
  if (config.googleServiceAccountEmail && config.googlePrivateKey && config.sheetId) {
    dataStoreInstance = new GoogleSheetsDataStore(config.sheetId);
  } else {
    // Without Google Cloud credentials, fall back to the existing in-memory store
    console.warn(
      "[DataStore Warning] Google Service Account credentials not provided. Using in-memory store."
    );
    dataStoreInstance = new MemoryDataStore(true);
  }

  return dataStoreInstance;
}

export function setDataStoreForTesting(mockStore: IDataStore): void {
  dataStoreInstance = mockStore;
}
