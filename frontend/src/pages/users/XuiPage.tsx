import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ApiError, deleteXuiClient, fetchConfig, fetchXuiClient, resetXuiClientTraffic, updateXuiClient } from "@/api";
import { Input } from "@/components/ui/input";
import { LookupActionForm } from "@/components/LookupActionForm";
import { SubscriptionNotFound } from "@/components/SubscriptionNotFound";
import { XuiClientCard } from "@/components/XuiClientCard";
import { getApiErrorMessage } from "@/utils/apiError";

export function UsersXuiPage() {
  const [defaultExpiryDays, setDefaultExpiryDays] = useState(30);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [getLoading, setGetLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [client, setClient] = useState<Awaited<ReturnType<typeof fetchXuiClient>> | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);

  useEffect(() => {
    fetchConfig()
      .then((config) => setDefaultExpiryDays(config.default_expiry_time_days))
      .catch(() => undefined);
  }, []);

  const reloadClient = async (username: string) => {
    setClient(await fetchXuiClient(username));
  };

  const onFetch = async () => {
    const username = email.trim();
    if (!username) {
      setEmailError("Введите имя пользователя");
      return;
    }

    setEmailError("");
    setGetLoading(true);
    setClient(null);
    setSearchAttempted(false);

    try {
      await reloadClient(username);
      setSearchAttempted(true);
    } catch (error) {
      setClient(null);
      setSearchAttempted(true);
      if (!(error instanceof ApiError && (error.status === 404 || error.status === 400))) {
        toast.error(getApiErrorMessage(error, "Не удалось получить подписку"));
      }
    } finally {
      setGetLoading(false);
    }
  };

  const onDelete = async (username: string) => {
    setActionLoading(true);

    try {
      await deleteXuiClient(username);
      setClient(null);
      toast.success("Клиент удалён");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось удалить клиента"));
    } finally {
      setActionLoading(false);
    }
  };

  const onUpdate = async (username: string, payload: { expiry_time_days: number; enable: boolean }) => {
    setActionLoading(true);

    try {
      await updateXuiClient(username, payload);
      await reloadClient(username);
      toast.success("Клиент обновлён");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось обновить клиента"));
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const onResetTraffic = async (username: string) => {
    setActionLoading(true);

    try {
      await resetXuiClientTraffic(username);
      await reloadClient(username);
      toast.success("Трафик сброшен");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось сбросить трафик"));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <LookupActionForm
      label="Username"
      name="email"
      input={
        <Input
          id="email"
          placeholder="Alex"
          value={email}
          aria-invalid={Boolean(emailError)}
          onChange={(event) => setEmail(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void onFetch();
            }
          }}
        />
      }
      loading={getLoading}
      onGet={() => void onFetch()}
      rules={[{ required: true, message: "Введите имя пользователя" }]}
      result={
        <>
          {emailError ? <p className="text-sm text-destructive">{emailError}</p> : null}
          {client ? (
            <div className="mt-4">
              <XuiClientCard
                client={client}
                access="user"
                defaultExpiryDays={defaultExpiryDays}
                actionLoading={actionLoading}
                onUpdate={onUpdate}
                onResetTraffic={onResetTraffic}
                onDelete={onDelete}
              />
            </div>
          ) : searchAttempted && !getLoading ? (
            <div className="mt-4">
              <SubscriptionNotFound embedded />
            </div>
          ) : null}
        </>
      }
    />
  );
}
