import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

import { fetchConfig } from "@/api";
import type { AppConfig } from "@/types";

type AppConfigContextValue = {
  config: AppConfig | null;
  loading: boolean;
  refreshConfig: () => Promise<void>;
};

const AppConfigContext = createContext<AppConfigContextValue | null>(null);

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (force: boolean) => {
    try {
      const next = await fetchConfig({ force });
      setConfig(next);
    } catch {
      if (!force) {
        setConfig(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
  }, [load, location.pathname]);

  const refreshConfig = useCallback(async () => {
    await load(true);
  }, [load]);

  const value = useMemo<AppConfigContextValue>(
    () => ({
      config,
      loading,
      refreshConfig,
    }),
    [config, loading, refreshConfig],
  );

  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>;
}

export function useAppConfig(): AppConfigContextValue {
  const context = useContext(AppConfigContext);
  if (!context) {
    throw new Error("useAppConfig must be used within AppConfigProvider");
  }
  return context;
}
