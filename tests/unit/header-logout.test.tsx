import React, { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Header } from "@/components/Header";

const { push, refresh } = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push, refresh }),
}));
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useState: vi.fn(),
}));

// Exercise the rendered control's handler without a browser or a real session.
function findLogout(node: React.ReactNode): (() => Promise<void>) | undefined {
  if (!React.isValidElement(node)) return;
  const props = node.props as {
    "aria-label"?: string;
    onClick?: () => Promise<void>;
    children?: React.ReactNode;
  };
  if (props["aria-label"] === "Odhlásit se") return props.onClick;
  for (const child of React.Children.toArray(props.children)) {
    const handler = findLogout(child);
    if (handler) return handler;
  }
}

describe("Header logout recovery", () => {
  const setLoggingOut = vi.fn();
  const setLogoutError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("React", React);
    vi.stubGlobal("window", { setTimeout, clearTimeout });
    vi.mocked(useState).mockReturnValueOnce([false, setLoggingOut])
      .mockReturnValueOnce([null, setLogoutError]);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("redirects only after successful logout", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    await findLogout(Header({ isLoggedIn: true }))!();
    expect(push).toHaveBeenCalledWith("/login");
    expect(refresh).toHaveBeenCalledOnce();
    expect(setLogoutError).toHaveBeenCalledExactlyOnceWith(null);
    expect(setLoggingOut).toHaveBeenLastCalledWith(false);
  });

  it.each(["HTTP error", "network failure"])("allows retry after %s", async (failure) => {
    vi.stubGlobal("fetch", failure === "HTTP error"
      ? vi.fn().mockResolvedValue({ ok: false })
      : vi.fn().mockRejectedValue(new TypeError("Network unavailable")));
    await findLogout(Header({ isLoggedIn: true }))!();
    expect(push).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    expect(setLogoutError).toHaveBeenLastCalledWith(expect.stringContaining("zkus to znovu"));
    expect(setLoggingOut).toHaveBeenLastCalledWith(false);
  });
});
