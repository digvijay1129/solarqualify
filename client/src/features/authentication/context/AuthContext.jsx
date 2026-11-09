import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ApiError } from "../../../services/api/api-error.js";
import {
  clearAccessToken,
  getStoredAccessToken,
  saveAccessToken,
} from "../../../services/api/token-storage.js";
import * as authenticationService from "../services/authentication.service.js";

const AuthContext = createContext(null);

function expectedRoleForSelection(role) {
  return role === "sales-staff" ? "salesStaff" : "homeowner";
}

function AuthProvider({ children }) {
  const [session, setSession] = useState({
    status: "checking",
    user: null,
    error: null,
  });

  const refreshSession = useCallback(async () => {
    const accessToken = getStoredAccessToken();

    if (!accessToken) {
      setSession({ status: "anonymous", user: null, error: null });
      return null;
    }

    setSession((current) => ({ ...current, status: "checking", error: null }));

    try {
      const user = await authenticationService.getCurrentUser();
      if (!user?.id || !user?.role) {
        throw new ApiError("The API returned an invalid user session.");
      }

      setSession({ status: "authenticated", user, error: null });
      return user;
    } catch (error) {
      if (error?.status === 401) {
        clearAccessToken();
        setSession({ status: "anonymous", user: null, error: null });
      } else {
        setSession({
          status: "unavailable",
          user: null,
          error: error?.message || "Your session could not be verified.",
        });
      }
      return null;
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const signIn = useCallback(async ({ role, email, password, rememberMe }) => {
    const result = await authenticationService.signIn({ email, password });

    if (!result?.accessToken || !result?.user) {
      throw new ApiError("The API did not return a valid login session.");
    }

    if (result.user.role !== expectedRoleForSelection(role)) {
      throw new ApiError(
        role === "sales-staff"
          ? "This account is not a Sales Staff account. Choose Homeowner or use a provisioned Sales Staff account."
          : "This account is not a Homeowner account. Choose Sales Staff to continue.",
        { status: 403 }
      );
    }

    if (!saveAccessToken(result.accessToken, rememberMe)) {
      throw new ApiError(
        "The browser could not store your session. Enable browser storage and try again."
      );
    }

    setSession({ status: "authenticated", user: result.user, error: null });
    return result.user;
  }, []);

  const registerHomeowner = useCallback(async (registration) => {
    const result = await authenticationService.registerHomeowner(registration);

    if (!result?.accessToken || !result?.user || result.user.role !== "homeowner") {
      throw new ApiError("The API did not return a valid homeowner account.");
    }

    if (!saveAccessToken(result.accessToken, false)) {
      throw new ApiError(
        "The browser could not store your session. Enable browser storage and try again."
      );
    }

    setSession({ status: "authenticated", user: result.user, error: null });
    return result.user;
  }, []);

  const signOut = useCallback(async () => {
    const accessToken = getStoredAccessToken();

    try {
      if (accessToken) {
        await authenticationService.signOut(accessToken);
      }
    } catch {
      // The API's logout endpoint is stateless; always discard the client token.
    } finally {
      clearAccessToken();
      setSession({ status: "anonymous", user: null, error: null });
    }
  }, []);

  const value = useMemo(() => ({
    user: session.user,
    status: session.status,
    sessionError: session.error,
    isAuthenticated: session.status === "authenticated",
    isLoading: session.status === "checking",
    signIn,
    registerHomeowner,
    signOut,
    refreshSession,
  }), [session, signIn, registerHomeowner, signOut, refreshSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}

export { AuthProvider, useAuth };
