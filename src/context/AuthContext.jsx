import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "../api/auth";
import { ApiError } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // On first load, ask the backend if the session cookie (if any) is still
  // valid — this is how a page refresh doesn't force a re-login.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await authApi.me();
        if (!cancelled) setUser(data.user);
      } catch {
        // 401 (not logged in) or network error — either way, no session.
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await authApi.login(username, password); // throws ApiError on failure
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if the network call fails, drop the local session state —
      // there's no useful "stay logged in" fallback if we can't reach
      // the server anyway.
    } finally {
      setUser(null);
    }
  }, []);

  const value = {
    user,
    role: user ? user.role : null,
    isAuthenticated: !!user,
    isAdmin: !!user && user.role === "Admin",
    initializing,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export { ApiError };
