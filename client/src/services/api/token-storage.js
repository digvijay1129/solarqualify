const ACCESS_TOKEN_KEY = "solarqualify.accessToken";
let memoryAccessToken = null;

function getStorage(storageName) {
  try {
    return globalThis[storageName] ?? null;
  } catch {
    return null;
  }
}

export function getStoredAccessToken() {
  const persistentStorage = getStorage("localStorage");
  const sessionStorage = getStorage("sessionStorage");

  try {
    const storedToken = persistentStorage?.getItem(ACCESS_TOKEN_KEY)
      || sessionStorage?.getItem(ACCESS_TOKEN_KEY);
    return storedToken || memoryAccessToken;
  } catch {
    return memoryAccessToken;
  }
}

export function saveAccessToken(accessToken, rememberMe = false) {
  if (typeof accessToken !== "string" || !accessToken.trim()) {
    return false;
  }

  clearAccessToken();

  const storage = getStorage(rememberMe ? "localStorage" : "sessionStorage");
  if (storage) {
    try {
      storage.setItem(ACCESS_TOKEN_KEY, accessToken);
      return true;
    } catch {
      // Fall back to an in-memory token when browser storage is disabled.
    }
  }

  memoryAccessToken = accessToken;
  return true;
}

export function clearAccessToken() {
  memoryAccessToken = null;

  for (const storageName of ["localStorage", "sessionStorage"]) {
    const storage = getStorage(storageName);

    try {
      storage?.removeItem(ACCESS_TOKEN_KEY);
    } catch {
      // Storage may be disabled by the browser. Continue clearing the other store.
    }
  }
}
