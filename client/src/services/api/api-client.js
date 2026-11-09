import { ApiError } from "./api-error.js";
import { getStoredAccessToken } from "./token-storage.js";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:5000/api/v1";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/+$/, "");

function isFormData(value) {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function hasHeader(headers, targetName) {
  return Object.keys(headers).some(
    (name) => name.toLowerCase() === targetName.toLowerCase()
  );
}

async function readResponse(response, responseType) {
  if (response.status === 204) return null;
  if (responseType === "blob") return response.blob();
  if (responseType === "text") return response.text();

  const rawBody = await response.text();
  if (!rawBody) return null;

  try {
    return JSON.parse(rawBody);
  } catch {
    return rawBody;
  }
}

export async function apiRequest(path, options = {}) {
  if (typeof path !== "string" || !path.trim()) {
    throw new TypeError("An API path is required.");
  }

  const {
    method = "GET",
    body,
    headers = {},
    signal,
    auth = true,
    accessToken,
    responseType = "json",
  } = options;

  const normalizedPath = path.startsWith("/") ? path : "/" + path;
  const requestHeaders = { Accept: "application/json", ...headers };
  const formDataBody = isFormData(body);
  let requestBody = body;

  if (body !== undefined && body !== null && !formDataBody && typeof body !== "string") {
    if (!hasHeader(requestHeaders, "Content-Type")) {
      requestHeaders["Content-Type"] = "application/json";
    }
    requestBody = JSON.stringify(body);
  }

  const token = accessToken ?? (auth ? getStoredAccessToken() : null);
  if (token) {
    requestHeaders.Authorization = "Bearer " + token;
  }

  let response;
  try {
    response = await fetch(API_BASE_URL + normalizedPath, {
      method: method.toUpperCase(),
      headers: requestHeaders,
      body: requestBody,
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;

    throw new ApiError(
      "Unable to reach the SolarQualify API. Check that the backend is running and the API URL is correct.",
      { cause: error }
    );
  }

  // Error responses are read as JSON/text even when the caller expected a binary payload.
  const responseData = await readResponse(response, response.ok ? responseType : "json");

  if (!response.ok) {
    const message = typeof responseData === "object" && responseData !== null
      ? responseData.message || responseData.error
      : responseData;

    throw new ApiError(
      typeof message === "string" && message.trim()
        ? message
        : "The request could not be completed.",
      {
        status: response.status,
        details: responseData?.errors ?? responseData?.details ?? null,
      }
    );
  }

  return responseData;
}
