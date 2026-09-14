import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSessionCookie, createSession, parseSession, setSessionCookie, SESSION_COOKIE_NAME } from "@/lib/auth/session";

const { set } = vi.hoisted(() => ({ set: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ set }) }));

describe("Production session security", () => {
  beforeEach(() => {
    set.mockClear();
    vi.stubEnv("SESSION_SECRET", "session-test-secret-with-at-least-32-characters");
  });
  afterEach(() => vi.unstubAllEnvs());

  it.each(["", "short"])("rejects an invalid signing secret", async (secret) => {
    vi.stubEnv("SESSION_SECRET", secret);
    await expect(createSession("admin@example.com")).rejects.toThrow("SESSION_SECRET is required");
  });

  it("signs sessions and rejects tampered cookies", async () => {
    const cookie = await createSession("admin@example.com");
    expect(await parseSession(cookie)).toEqual(expect.objectContaining({ email: "admin@example.com" }));
    expect(await parseSession(`invalid.${cookie.split(".")[1]}`)).toBeNull();
  });

  it("sets and clears cookies with the existing production options", async () => {
    const options = { httpOnly: true, secure: true, sameSite: "lax", path: "/" };
    await setSessionCookie("admin@example.com");
    expect(set).toHaveBeenLastCalledWith(SESSION_COOKIE_NAME, expect.any(String), {
      ...options, maxAge: 30 * 24 * 60 * 60,
    });
    await clearSessionCookie();
    expect(set).toHaveBeenLastCalledWith(SESSION_COOKIE_NAME, "", { ...options, maxAge: 0 });
  });
});
