import { getPeopleService } from "@/services/people-service";
import { getPresetService } from "@/services/preset-service";
import { getDeadlineService } from "@/services/deadline-service";
import { getRoomService } from "@/services/room-service";
import { getConfig } from "@/lib/config/env";
import { SettingsView } from "@/components/SettingsView";
import { requireAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireAdminSession({ redirectOnUnauth: true });

  const people = await getPeopleService().getAll();
  const presets = await getPresetService().getAll();
  const deadlines = await getDeadlineService().getAll();
  const rooms = await getRoomService().getAll();
  const config = getConfig();

  const maskedSheetId = config.sheetId
    ? `${config.sheetId.slice(0, 5)}...${config.sheetId.slice(-4)}`
    : "žádná";

  const storageType =
    config.googleServiceAccountEmail && config.googlePrivateKey
      ? "Google Sheets API (Service Account)"
      : "In-Memory Store";

  const systemInfo = {
    maskedSheetId,
    storageType,
    adminEmail: config.adminEmail,
  };

  return (
    <SettingsView
      people={people}
      presets={presets}
      rooms={rooms}
      deadlines={deadlines}
      systemInfo={systemInfo}
    />
  );
}
