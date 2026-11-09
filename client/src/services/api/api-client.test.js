import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "./api-error.js";
import { apiRequest } from "./api-client.js";

function createStorage(token = null) {
  return {
    getItem: (key) => key === "solarqualify.accessToken" ? token : null,
    setItem: vi.fn(),
    removeItem: vi.fn(),
  };
}

describe("shared API client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("adds the stored bearer token and serializes JSON bodies", async () => {
    vi.stubGlobal("localStorage", createStorage("test-access-token"));
    vi.stubGlobal("sessionStorage", createStorage());
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { ok: true } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiRequest("/auth/login", {
      method: "POST",
      body: { email: "person@example.com", password: "not-logged" },
    });

    expect(result.data.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("/auth/login");
    expect(options.headers.Authorization).toBe("Bearer test-access-token");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(options.body).toBe(JSON.stringify({ email: "person@example.com", password: "not-logged" }));
  });

  it("can omit authentication for public login and registration endpoints", async () => {
    vi.stubGlobal("localStorage", createStorage("existing-token"));
    vi.stubGlobal("sessionStorage", createStorage());
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest("/auth/login", { auth: false, method: "POST", body: { email: "a@b.com", password: "pass" } });

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it("normalizes failed API responses into ApiError instances", async () => {
    vi.stubGlobal("localStorage", createStorage());
    vi.stubGlobal("sessionStorage", createStorage());
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: false, message: "Invalid credentials." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    ));

    await expect(apiRequest("/auth/login", { auth: false })).rejects.toMatchObject({
      name: "ApiError",
      message: "Invalid credentials.",
      status: 401,
    });
  });

  it("wraps network failures in ApiError", async () => {
    vi.stubGlobal("localStorage", createStorage());
    vi.stubGlobal("sessionStorage", createStorage());
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    await expect(apiRequest("/auth/me")).rejects.toBeInstanceOf(ApiError);
  });

  it("supports FormData without forcing a JSON content type", async () => {
    vi.stubGlobal("localStorage", createStorage());
    vi.stubGlobal("sessionStorage", createStorage());
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const formData = new FormData();
    formData.append("document", new Blob(["file"]), "bill.pdf");

    await apiRequest("/leads/lead-id/bill", { method: "POST", body: formData });

    expect(fetchMock.mock.calls[0][1].headers["Content-Type"]).toBeUndefined();
  });
});
