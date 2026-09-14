import { describe, expect, it, vi } from "vitest";
import type { sheets_v4 } from "googleapis";
import { GoogleSheetsDataStore, ROOM_COLUMNS } from "@/repositories/google-sheets/sheets-repository";

function mockSheets() {
  const data = new Map<string, string[][]>([["Rooms", [ROOM_COLUMNS, ["r-1", "Pokoj", "TRUE", "1", "created", "updated"]]]]);
  const get = vi.fn(async () => ({ data: { sheets: [...data.keys()].map((title, sheetId) => ({ properties: { title, sheetId } })) } }));
  const batchUpdate = vi.fn(async ({ requestBody }: { requestBody: { requests: sheets_v4.Schema$Request[] } }) => {
    const title = requestBody.requests[0].addSheet!.properties!.title!;
    if (data.has(title)) throw new Error("Already exists");
    const rows = requestBody.requests[1].updateCells!.rows!;
    data.set(title, rows.map((r) => r.values!.map((v) => v.userEnteredValue!.stringValue!)));
    return { data: {} };
  });
  const values = {
    get: vi.fn(async ({ range }: { range: string }) => {
      const [title, cells] = range.split("!");
      const rows = data.get(title);
      if (!rows) throw new Error("Missing sheet");
      return { data: { values: cells.startsWith("A2") ? rows.slice(1) : rows.slice(0, 1) } };
    }),
    append: vi.fn(async ({ range, requestBody }: { range: string; requestBody: { values: string[][] } }) => {
      data.get(range.split("!")[0])!.push(...requestBody.values);
      return { data: {} };
    }),
    update: vi.fn(async ({ range, requestBody }: { range: string; requestBody: { values: string[][] } }) => {
      const [title, cells] = range.split("!");
      const row = Number(cells.match(/A(\d+)/)![1]) - 1;
      data.get(title)![row] = requestBody.values[0];
      return { data: {} };
    }),
  };
  return { data, batchUpdate, client: { spreadsheets: { get, batchUpdate, values } } as unknown as sheets_v4.Sheets };
}

describe("Deadline Google Sheets persistence", () => {
  it("adds and seeds only the new sheet, then persists edits across repository instances", async () => {
    const mock = mockSheets();
    const roomsBefore = JSON.stringify(mock.data.get("Rooms"));
    const store = new GoogleSheetsDataStore("sheet", mock.client);
    const original = await store.deadlines.getAll();
    expect(original.map((d) => d.name)).toEqual(["Dnes", "Dnes večer", "Zítra", "Do pátku", "O víkendu"]);
    await store.deadlines.create({ ...original[0], id: "custom", name: "Do oběda", sortOrder: 0 });
    await store.deadlines.update({ ...original[0], name: "Jindy", active: false });
    const reloaded = new GoogleSheetsDataStore("sheet", mock.client);
    expect((await reloaded.deadlines.getAll())[0].name).toBe("Do oběda");
    expect(await reloaded.deadlines.getById(original[0].id)).toMatchObject({ name: "Jindy", active: false });
    expect(mock.batchUpdate).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(mock.data.get("Rooms"))).toBe(roomsBefore);
    expect((await reloaded.rooms.getAll())[0].name).toBe("Pokoj");
  });

  it("does not reseed an existing empty collection", async () => {
    const mock = mockSheets();
    mock.data.set("Deadlines", [ROOM_COLUMNS]);
    expect(await new GoogleSheetsDataStore("sheet", mock.client).deadlines.getAll()).toEqual([]);
    expect(mock.batchUpdate).not.toHaveBeenCalled();
  });

  it("handles concurrent first reads without duplicating defaults", async () => {
    const mock = mockSheets();
    const a = new GoogleSheetsDataStore("sheet", mock.client);
    const b = new GoogleSheetsDataStore("sheet", mock.client);
    const results = await Promise.all([a.deadlines.getAll(), b.deadlines.getAll()]);
    expect(results.map((r) => r.length)).toEqual([5, 5]);
    expect(mock.data.get("Deadlines")).toHaveLength(6);
  });

  it("propagates creation failures and permits retry", async () => {
    const mock = mockSheets();
    mock.batchUpdate.mockRejectedValueOnce(new Error("Permission denied"));
    const store = new GoogleSheetsDataStore("sheet", mock.client);
    await expect(store.deadlines.getAll()).rejects.toThrow("Permission denied");
    expect(await store.deadlines.getAll()).toHaveLength(5);
  });
});
