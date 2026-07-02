import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { clearAuthToken, fetchMe, setUnauthorizedHandler } from "@/api";
import { TOKEN_KEY } from "@/constants";
import type { UserProfile } from "@/types";

function parseAuthTokenFromUrl(): string {
  return new URLSearchParams(window.location.search).get("authToken")?.trim() || "";
}

function stripAuthTokenFromUrl(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("authToken")) {
    return;
  }

  url.searchParams.delete("authToken");
  const query = url.searchParams.toString();
  window.history.replaceState({}, "", `${url.pathname}${query ? `?${query}` : ""}${url.hash}`);
}

type AuthContextValue = {
  user: UserProfile | null;
  loading: boolean;
  login: (token: string) => Promise<UserProfile>;
  logout: () => void;
  refreshUser: () => Promise<UserProfile>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      navigate("/login", { replace: true, state: { error: "Сессия истекла, войдите заново" } });
    });

    return () => setUnauthorizedHandler(null);
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const urlToken = parseAuthTokenFromUrl();

      if (urlToken) {
        clearAuthToken();
        stripAuthTokenFromUrl();

        try {
          localStorage.setItem(TOKEN_KEY, urlToken);
          const profile = await fetchMe();
          if (!cancelled) {
            setUser(profile);
          }
        } catch {
          if (!cancelled) {
            navigate("/login", { replace: true, state: { error: "Неверный токен" } });
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
        return;
      }

      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const profile = await fetchMe();
        if (!cancelled) {
          setUser(profile);
        }
      } catch {
        // 401 handled globally in api.ts
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const login = useCallback(async (token: string) => {
    localStorage.setItem(TOKEN_KEY, token.trim());
    const profile = await fetchMe();
    setUser(profile);
    return profile;
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const profile = await fetchMe();
    setUser(profile);
    return profile;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login,
      logout,
      refreshUser,
    }),
    [user, loading, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
