import { Input } from "@/components/ui/input";
import { LookupActionForm } from "@/components/LookupActionForm";
import { SubscriptionNotFound } from "@/components/SubscriptionNotFound";
import { XuiClientCard } from "@/components/XuiClientCard";
import { useUsersContext } from "@/pages/users/useUsersContext";

export function UsersXuiPage() {
  const {
    xuiEmail,
    setXuiEmail,
    xuiEmailError,
    xuiGetLoading,
    xuiClient,
    xuiSearchAttempted,
    defaultExpiryDays,
    xuiActionLoading,
    onFetchXuiClient,
    onUpdateXuiClient,
    onResetXuiTraffic,
    onDeleteXuiClient,
  } = useUsersContext();

  return (
    <LookupActionForm
      label="Username"
      name="email"
      input={
        <Input
          id="email"
          placeholder="Alex"
          value={xuiEmail}
          aria-invalid={Boolean(xuiEmailError)}
          onChange={(event) => setXuiEmail(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void onFetchXuiClient();
            }
          }}
        />
      }
      loading={xuiGetLoading}
      onGet={() => void onFetchXuiClient()}
      rules={[{ required: true, message: "Введите имя пользователя" }]}
      result={
        <>
          {xuiEmailError ? <p className="text-sm text-destructive">{xuiEmailError}</p> : null}
          {xuiClient ? (
            <div className="mt-4">
              <XuiClientCard
                client={xuiClient}
                access="user"
                defaultExpiryDays={defaultExpiryDays}
                actionLoading={xuiActionLoading}
                onUpdate={onUpdateXuiClient}
                onResetTraffic={onResetXuiTraffic}
                onDelete={onDeleteXuiClient}
              />
            </div>
          ) : xuiSearchAttempted && !xuiGetLoading ? (
            <div className="mt-4">
              <SubscriptionNotFound embedded />
            </div>
          ) : null}
        </>
      }
    />
  );
}
