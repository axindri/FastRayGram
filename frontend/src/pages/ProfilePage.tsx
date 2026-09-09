import { FileText, Loader2, RefreshCw, TriangleAlert, Wallet } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { canRenewSubscription, createInvoice, fetchConfig, fetchXuiMe } from "@/api";
import { DAY_PRICE_RUB, MIN_PAYMENT_AMOUNT, MIN_PAYMENT_DAYS, RENEW_HINT } from "@/constants";
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
import { useServiceStatus } from "@/hooks/useServiceStatus";
import { getApiErrorMessage } from "@/utils/apiError";
import { isInvoiceActive, type UserRole } from "@/types";

const DAY_PRESETS = [50, 70, 100] as const;

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
  const { user, refreshUser } = useAuth();

  const [maxAmount, setMaxAmount] = useState(1000);
  const [days, setDays] = useState(MIN_PAYMENT_DAYS);
  const [daysError, setDaysError] = useState("");
  const { loading: statusLoading, paymentBlocked } = useServiceStatus();
  const [profileLoading, setProfileLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [xuiClient, setXuiClient] = useState<Awaited<ReturnType<typeof fetchXuiMe>> | null>(null);
  const [xuiLoading, setXuiLoading] = useState(false);
  const [xuiLoaded, setXuiLoaded] = useState(false);

  const maxDays = useMemo(() => Math.floor(maxAmount / DAY_PRICE_RUB), [maxAmount]);
  const amount = days * DAY_PRICE_RUB;
  const dayPresets = useMemo(() => DAY_PRESETS.filter((preset) => preset >= MIN_PAYMENT_DAYS && preset <= maxDays), [maxDays]);

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

      const nextMaxAmount = Math.max(config.max_invoice_amount, MIN_PAYMENT_AMOUNT);
      setMaxAmount(nextMaxAmount);
      setDays(MIN_PAYMENT_DAYS);
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

  const onDaysChange = (nextDays: number) => {
    setDays(nextDays);
    if (daysError) {
      setDaysError("");
    }
  };

  const onCreatePayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (paymentsDisabled || !canRenew) {
      return;
    }

    if (!Number.isInteger(days) || days < MIN_PAYMENT_DAYS || days > maxDays) {
      setDaysError(`От ${MIN_PAYMENT_DAYS} до ${maxDays} дней`);
      return;
    }

    if (amount < MIN_PAYMENT_AMOUNT || amount > maxAmount) {
      setDaysError(`Сумма от ${MIN_PAYMENT_AMOUNT} до ${maxAmount} ₽`);
      return;
    }

    setDaysError("");
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
          {xuiLoading && !xuiClient ? (
            <Card className="min-h-48">
              <CardContent className="flex min-h-48 items-center justify-center">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : xuiClient ? (
            <XuiClientCard client={xuiClient} access="user" />
          ) : xuiLoaded ? (
            <SubscriptionNotFound />
          ) : null}

          {canRenew && !hasActiveInvoice ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  <CardTitleWithIcon icon={Wallet}>Новый счёт</CardTitleWithIcon>
                </CardTitle>
                <CardDescription>Создайте счёт для оплаты подписки</CardDescription>
              </CardHeader>
              <CardContent>
                <form id="profile-payment-form" className="flex flex-col gap-5" onSubmit={onCreatePayment}>
                  <div className="rounded-lg border bg-muted/40 p-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">К оплате</p>
                        <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">{amount.toLocaleString("ru-RU")} ₽</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Срок подписки</p>
                        <p className="text-xl font-semibold text-foreground tabular-nums">{days} дн.</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {days} × {DAY_PRICE_RUB} ₽/день = {amount.toLocaleString("ru-RU")} ₽<span className="text-muted-foreground/80"></span>
                    </p>
                  </div>
                  {dayPresets.length ? (
                    <div className="flex flex-wrap gap-2">
                      {dayPresets.map((preset) => (
                        <Button key={preset} type="button" variant="outline" size="sm" disabled={paymentsDisabled} onClick={() => onDaysChange(preset)}>
                          {preset} дней
                        </Button>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex flex-col gap-2">
                    <input
                      type="range"
                      min={MIN_PAYMENT_DAYS}
                      max={maxDays}
                      step={1}
                      value={Math.min(Math.max(days, MIN_PAYMENT_DAYS), maxDays)}
                      disabled={paymentsDisabled}
                      onChange={(event) => onDaysChange(Number(event.target.value))}
                      className="w-full accent-foreground"
                      aria-label="Выбор количества дней"
                      aria-invalid={Boolean(daysError)}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{MIN_PAYMENT_DAYS} дн.</span>
                      <span>{maxDays} дн.</span>
                    </div>
                    {daysError ? <p className="text-sm text-destructive">{daysError}</p> : null}
                  </div>
                </form>
              </CardContent>
              <CardFooter>
                <Button type="submit" form="profile-payment-form" disabled={paymentsDisabled || paymentLoading}>
                  {paymentLoading ? <Loader2 className="animate-spin" /> : null}
                  Оплатить {amount.toLocaleString("ru-RU")} ₽
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
