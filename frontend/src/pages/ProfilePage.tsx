import { Copy, FileText, Link as LinkIcon, Loader2, RefreshCw, TriangleAlert, Wallet } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { buildAuthLink, canRenewSubscription, createInvoice, fetchConfig, fetchXuiMe, refreshMyToken } from "@/api";
import { RENEW_HINT, TOKEN_KEY } from "@/constants";
import { useAuth } from "@/auth";
import { AsyncListState } from "@/components/AsyncListState";
import { CardTitleWithIcon } from "@/components/CardTitleWithIcon";
import { HintTooltip } from "@/components/HintTooltip";
import { InvoiceCard } from "@/components/InvoiceCard";
import { PageShell } from "@/components/PageShell";
import { SectionCard } from "@/components/SectionCard";
import { SubscriptionNotFound } from "@/components/SubscriptionNotFound";
import { XuiClientCard } from "@/components/XuiClientCard";
import { filterNavItems, flattenNavLinks } from "@/config/navigation";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useServiceStatus } from "@/hooks/useServiceStatus";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatJwtExpiryRemaining, isJwtToken, jwtExpiryTagColor } from "@/utils/jwt";
import { isInvoiceActive, type UserRole } from "@/types";

import { BADGE_STYLES } from "@/lib/badge-styles";

function expiryBadgeClassName(color: "success" | "error" | "default") {
  if (color === "success") {
    return BADGE_STYLES.success;
  }

  return undefined;
}

function QuickLinks({ role }: { role: UserRole }) {
  const sections = useMemo(() => flattenNavLinks(filterNavItems(role, { excludePaths: ["/profile", "/settings"] })), [role]);

  if (!sections.length) {
    return null;
  }

  return (
    <SectionCard title="Быстрый переход" hint="Разделы, доступные для вашей роли">
      <div className="grid gap-2 sm:grid-cols-2">
        {sections.map((item) => (
          <Button key={item.path} variant="outline" className="h-auto justify-start px-4 py-3" asChild>
            <Link to={item.path}>
              <item.Icon />
              <span className="flex flex-col items-start gap-0.5 text-left">
                <span className="font-medium">{item.label}</span>
                <span className="text-xs font-normal text-muted-foreground">{item.hint}</span>
              </span>
            </Link>
          </Button>
        ))}
      </div>
    </SectionCard>
  );
}

export function ProfilePage() {
  const { user, refreshUser, login } = useAuth();
  const copy = useCopyToClipboard();
  const [authToken, setAuthToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [tokenRefreshLoading, setTokenRefreshLoading] = useState(false);

  const [minAmount, setMinAmount] = useState(100);
  const [maxAmount, setMaxAmount] = useState(1000);
  const [amount, setAmount] = useState(100);
  const [amountError, setAmountError] = useState("");
  const { loading: statusLoading, paymentBlocked } = useServiceStatus();
  const [profileLoading, setProfileLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [xuiClient, setXuiClient] = useState<Awaited<ReturnType<typeof fetchXuiMe>> | null>(null);
  const [xuiLoading, setXuiLoading] = useState(false);
  const [xuiLoaded, setXuiLoaded] = useState(false);

  const authLink = useMemo(() => (authToken ? buildAuthLink(authToken) : ""), [authToken]);
  const tokenExpiryLabel = useMemo(() => formatJwtExpiryRemaining(authToken), [authToken]);
  const tokenExpiryColor = useMemo(() => jwtExpiryTagColor(authToken), [authToken]);

  const loadXuiClient = async () => {
    setXuiLoading(true);

    try {
      setXuiClient(await fetchXuiMe());
    } catch {
      setXuiClient(null);
    } finally {
      setXuiLoading(false);
      setXuiLoaded(true);
    }
  };

  const loadProfile = async () => {
    setProfileLoading(true);

    try {
      const profile = await refreshUser();
      if (profile.role !== "superuser") {
        await loadXuiClient();
      } else {
        setXuiClient(null);
      }
    } catch {
      toast.error("Не удалось обновить профиль");
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role !== "superuser") {
      void loadXuiClient();
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    let cancelled = false;

    void fetchConfig().then((config) => {
      if (cancelled) {
        return;
      }

      setMinAmount(config.min_invoice_amount);
      setMaxAmount(config.max_invoice_amount);
      setAmount(config.min_invoice_amount);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) {
    return null;
  }

  const invoices = user.invoices ?? [];
  const hasActiveInvoice = invoices.some((item) => isInvoiceActive(item.status));
  const paymentsDisabled = statusLoading || paymentBlocked;
  const canRenew = xuiClient ? canRenewSubscription(xuiClient.expiry_datetime) : false;
  const showAuthTokenControls = user.role !== "superuser" && isJwtToken(authToken);

  const onRefreshAuthToken = async () => {
    setTokenRefreshLoading(true);

    try {
      const token = await refreshMyToken();
      await login(token);
      setAuthToken(token);
      toast.success("Токен обновлён. Скопируйте новую ссылку для входа — старая больше не действует");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось обновить токен"));
    } finally {
      setTokenRefreshLoading(false);
    }
  };

  const onCreatePayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (paymentsDisabled || !canRenew) {
      return;
    }

    if (!amount) {
      setAmountError("Введите сумму");
      return;
    }

    if (amount < minAmount || amount > maxAmount) {
      setAmountError(`От ${minAmount} до ${maxAmount} ₽`);
      return;
    }

    setAmountError("");
    setPaymentLoading(true);

    try {
      const invoice = await createInvoice(amount);
      window.open(invoice.confirmation_url, "_blank", "noopener,noreferrer");
      await refreshUser();
      toast.success("Счёт создан, открыта страница оплаты");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось создать платёж"));
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <PageShell title="Профиль">
      {user.role !== "superuser" ? (
        <>
          <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
            {authLink ? (
              <Card className="flex h-full flex-col">
                <CardHeader>
                  <CardTitle>
                    <CardTitleWithIcon icon={LinkIcon}>Ссылка для входа</CardTitleWithIcon>
                  </CardTitle>
                  <CardDescription>Сохраните ссылку для другого устройства. После обновления старая перестаёт работать.</CardDescription>
                  {showAuthTokenControls && tokenExpiryLabel ? (
                    <CardAction>
                      <Badge variant={tokenExpiryColor === "error" ? "destructive" : "outline"} className={cn(expiryBadgeClassName(tokenExpiryColor))}>
                        Активна {tokenExpiryLabel}
                      </Badge>
                    </CardAction>
                  ) : null}
                </CardHeader>
                <CardFooter className="mt-auto gap-2">
                  <Button type="button" variant="outline" onClick={() => copy(authLink)}>
                    <Copy />
                    Скопировать
                  </Button>
                  {showAuthTokenControls ? (
                    <Button type="button" variant="outline" disabled={tokenRefreshLoading} onClick={() => void onRefreshAuthToken()}>
                      {tokenRefreshLoading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                      Обновить
                    </Button>
                  ) : null}
                </CardFooter>
              </Card>
            ) : null}
            {xuiLoading && !xuiClient ? (
              <Card className="flex h-full min-h-48 flex-col">
                <CardContent className="flex flex-1 items-center justify-center">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ) : xuiClient ? (
              <XuiClientCard client={xuiClient} access="user" className="h-full" />
            ) : xuiLoaded ? (
              <SubscriptionNotFound className="h-full min-h-48" />
            ) : null}
          </div>

          {canRenew && !hasActiveInvoice ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  <CardTitleWithIcon icon={Wallet}>Новый счёт</CardTitleWithIcon>
                </CardTitle>
                <CardDescription>Создайте счёт для оплаты подписки</CardDescription>
              </CardHeader>
              <CardContent>
                <form id="profile-payment-form" className="flex flex-col gap-4" onSubmit={onCreatePayment}>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="profile-amount">Сумма, ₽</Label>
                    <Input
                      id="profile-amount"
                      type="number"
                      min={minAmount}
                      max={maxAmount}
                      value={amount}
                      disabled={paymentsDisabled}
                      aria-invalid={Boolean(amountError)}
                      onChange={(event) => setAmount(Number(event.target.value))}
                      className="w-32"
                    />
                    {amountError ? <p className="text-sm text-destructive">{amountError}</p> : null}
                  </div>
                </form>
              </CardContent>
              <CardFooter>
                <Button type="submit" form="profile-payment-form" disabled={paymentsDisabled || paymentLoading}>
                  {paymentLoading ? <Loader2 className="animate-spin" /> : null}
                  Создать и оплатить
                </Button>
              </CardFooter>
            </Card>
          ) : null}
        </>
      ) : null}

      {user.role !== "superuser" ? (
        <SectionCard
          title={<CardTitleWithIcon icon={FileText}>Мои счета</CardTitleWithIcon>}
          hint={
            <span className="inline-flex flex-wrap items-center gap-1">
              Оплаченные, отменённые и активные счета <HintTooltip title={RENEW_HINT} />
            </span>
          }
          extra={
            <Button type="button" variant="outline" size="sm" disabled={profileLoading} onClick={() => void loadProfile()}>
              {profileLoading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              Обновить
            </Button>
          }
        >
          {hasActiveInvoice ? (
            <Alert className="mb-4 border-amber-500/50 bg-amber-50 text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-50">
              <TriangleAlert className="text-amber-600 dark:text-amber-400" />
              <AlertTitle>Обработка платежа</AlertTitle>
              <AlertDescription>После оплаты статус может оставаться «В обработке» до минуты. Нажмите «Обновить», если статус не изменился.</AlertDescription>
            </Alert>
          ) : null}
          <AsyncListState loading={profileLoading} empty={!invoices.length} emptyDescription="Счетов пока нет" minHeight={80} size="default">
            {invoices.map((item) => (
              <InvoiceCard key={item.id} item={item} access="user" paymentBlocked={paymentsDisabled} canRenew={canRenew} />
            ))}
          </AsyncListState>
        </SectionCard>
      ) : null}

      <QuickLinks role={user.role} />
    </PageShell>
  );
}
