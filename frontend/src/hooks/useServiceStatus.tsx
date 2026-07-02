import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { fetchStatus } from "../api";
import { getUnavailableServiceNames } from "../types";

export const STATUS_POLL_MS = 60_000;

type ServiceStatusContextValue = {
  loading: boolean;
  statusError: boolean;
  paymentBlocked: boolean;
  unavailable: string[];
  refreshStatus: () => Promise<void>;
};

const ServiceStatusContext = createContext<ServiceStatusContextValue | null>(null);

export function ServiceStatusProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [statusError, setStatusError] = useState(false);
  const [paymentBlocked, setPaymentBlocked] = useState(true);
  const [unavailable, setUnavailable] = useState<string[]>([]);

  const loadStatus = useCallback(async (quiet = false) => {
    console.log(`Loading status (quiet = ${quiet})`);
    if (!quiet) {
      setLoading(true);
    }

    try {
      const status = await fetchStatus();
      const names = getUnavailableServiceNames(status);
      setUnavailable(names);
      setPaymentBlocked(names.length > 0);
      setStatusError(false);
    } catch {
      setUnavailable([]);
      setPaymentBlocked(true);
      setStatusError(true);
    } finally {
      if (!quiet) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadStatus();

    const timer = window.setInterval(() => void loadStatus(true), STATUS_POLL_MS);
    console.log(`Set interval loading status to ${STATUS_POLL_MS}ms`);
    return () => window.clearInterval(timer);
  }, [loadStatus]);

  const value = useMemo<ServiceStatusContextValue>(
    () => ({
      loading,
      statusError,
      paymentBlocked,
      unavailable,
      refreshStatus: () => loadStatus(),
    }),
    [loading, statusError, paymentBlocked, unavailable, loadStatus],
  );

  return <ServiceStatusContext.Provider value={value}>{children}</ServiceStatusContext.Provider>;
}

export function useServiceStatus() {
  const context = useContext(ServiceStatusContext);
  if (!context) {
    throw new Error("useServiceStatus must be used within ServiceStatusProvider");
  }
  return context;
}
