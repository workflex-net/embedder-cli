// Original: src/context/AuthContext.tsx
// Extracted: context.js

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

interface AuthContextValue {
  isAuthenticated: boolean;
  user: { id: string; email: string } | null;
  token: string | null;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const getToken = useCallback(() => {
    return token;
  }, [token]);

  const apiFetch = useCallback(
    async (url: string, options?: RequestInit) => {
      const headers = new Headers(options?.headers);
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return fetch(url, { ...options, headers });
    },
    [token]
  );

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setToken(data.token);
    setUser(data.user);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, user, token, apiFetch, login, logout, getToken }),
    [isAuthenticated, user, token, apiFetch, login, logout, getToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
