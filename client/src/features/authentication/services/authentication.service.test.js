import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../services/api/api-client.js", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "../../../services/api/api-client.js";
import {
  getCurrentUser,
  registerHomeowner,
  signIn,
  signOut,
} from "./authentication.service.js";

describe("authentication API service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs in with email and password through the public auth endpoint", async () => {
    apiRequest.mockResolvedValue({
      success: true,
      data: { user: { id: "user-1", role: "homeowner" }, accessToken: "token" },
    });

    const result = await signIn({ email: "person@example.com", password: "Secret123" });

    expect(apiRequest).toHaveBeenCalledWith("/auth/login", {
      method: "POST",
      auth: false,
      body: { email: "person@example.com", password: "Secret123" },
    });
    expect(result.accessToken).toBe("token");
  });

  it("registers a homeowner without sending unsupported address/property fields", async () => {
    apiRequest.mockResolvedValue({
      success: true,
      data: { user: { id: "user-2", role: "homeowner" }, accessToken: "new-token" },
    });

    await registerHomeowner({
      name: "Asha Patil",
      email: "asha@example.com",
      phone: "+91 9876543210",
      password: "Secret123",
      address: "not sent",
    });

    expect(apiRequest).toHaveBeenCalledWith("/auth/register", {
      method: "POST",
      auth: false,
      body: {
        name: "Asha Patil",
        email: "asha@example.com",
        phone: "+91 9876543210",
        password: "Secret123",
      },
    });
  });

  it("loads the current user from the protected session endpoint", async () => {
    const user = { id: "user-1", name: "Asha", role: "homeowner" };
    apiRequest.mockResolvedValue({ success: true, data: { user } });

    await expect(getCurrentUser()).resolves.toEqual(user);
    expect(apiRequest).toHaveBeenCalledWith("/auth/me");
  });

  it("sends the existing token when calling the logout endpoint", async () => {
    apiRequest.mockResolvedValue({ success: true });
    await signOut("access-token");

    expect(apiRequest).toHaveBeenCalledWith("/auth/logout", {
      method: "POST",
      accessToken: "access-token",
    });
  });
});
