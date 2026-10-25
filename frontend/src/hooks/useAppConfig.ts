import { useEffect, useState } from "react";

import { fetchConfig } from "@/api";
import type { AppConfig } from "@/types";

type UseAppConfigResult = {
  config: AppConfig | null;
  loading: boolean;
};

/** Reads /config once via shared fetchConfig cache. */
export function useAppConfig(): UseAppConfigResult {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void fetchConfig()
      .then((next) => {
        if (!cancelled) {
          setConfig(next);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setConfig(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { config, loading };
}
