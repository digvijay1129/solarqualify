import { apiRequest } from "../../../services/api/api-client.js";
import { getAuthenticationContent, submitDemoPasswordReset } from "../../../mocks/repositories/authentication.repository.js";

function unwrapAuthResult(response) {
  return response?.data ?? response;
}

export function getAuthContent() {
  return getAuthenticationContent();
}

export async function signIn(credentials) {
  const response = await apiRequest("/auth/login", {
    method: "POST",
    auth: false,
    body: {
      email: credentials.email,
      password: credentials.password,
    },
  });

  return unwrapAuthResult(response);
}

export async function registerHomeowner(registration) {
  const response = await apiRequest("/auth/register", {
    method: "POST",
    auth: false,
    body: {
      name: registration.name,
      email: registration.email,
      password: registration.password,
      phone: registration.phone,
    },
  });

  return unwrapAuthResult(response);
}

export async function getCurrentUser() {
  const response = await apiRequest("/auth/me");
  const data = response?.data ?? response;
  return data?.user ?? null;
}

export async function signOut(accessToken) {
  return apiRequest("/auth/logout", {
    method: "POST",
    accessToken,
  });
}

export function requestPasswordResetDemo() {
  return submitDemoPasswordReset();
}
