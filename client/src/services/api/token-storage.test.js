import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearAccessToken,
  getStoredAccessToken,
  saveAccessToken,
} from "./token-storage.js";

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

describe("access token storage", () => {
  afterEach(() => {
    clearAccessToken();
    vi.unstubAllGlobals();
  });

  it("stores a temporary session in sessionStorage by default", () => {
    const local = createStorage();
    const session = createStorage();
    vi.stubGlobal("localStorage", local);
    vi.stubGlobal("sessionStorage", session);

    expect(saveAccessToken("session-token")).toBe(true);
    expect(getStoredAccessToken()).toBe("session-token");
    expect(local.getItem("solarqualify.accessToken")).toBeNull();
  });

  it("stores a remembered session in localStorage", () => {
    const local = createStorage();
    const session = createStorage();
    vi.stubGlobal("localStorage", local);
    vi.stubGlobal("sessionStorage", session);

    expect(saveAccessToken("remembered-token", true)).toBe(true);
    expect(getStoredAccessToken()).toBe("remembered-token");
    expect(session.getItem("solarqualify.accessToken")).toBeNull();
  });

  it("replaces a token instead of leaving both storage copies behind", () => {
    const local = createStorage();
    const session = createStorage();
    vi.stubGlobal("localStorage", local);
    vi.stubGlobal("sessionStorage", session);

    saveAccessToken("old-token", true);
    saveAccessToken("new-token", false);

    expect(getStoredAccessToken()).toBe("new-token");
    expect(local.getItem("solarqualify.accessToken")).toBeNull();
  });

  it("clears both storage locations on logout", () => {
    const local = createStorage();
    const session = createStorage();
    vi.stubGlobal("localStorage", local);
    vi.stubGlobal("sessionStorage", session);

    saveAccessToken("token", true);
    clearAccessToken();

    expect(getStoredAccessToken()).toBeNull();
  });

  it("uses in-memory storage when browser storage is unavailable", () => {
    vi.stubGlobal("localStorage", undefined);
    vi.stubGlobal("sessionStorage", undefined);

    expect(saveAccessToken("memory-token")).toBe(true);
    expect(getStoredAccessToken()).toBe("memory-token");
  });

  it("rejects empty access tokens", () => {
    vi.stubGlobal("localStorage", createStorage());
    vi.stubGlobal("sessionStorage", createStorage());
    expect(saveAccessToken(" ")).toBe(false);
  });
});
