import { ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { fetchAdminLinks, fetchFinances, fetchStatus } from "@/api";
import { SectionCard } from "@/components/SectionCard";
import { getApiErrorMessage } from "@/utils/apiError";
import { BADGE_STYLES } from "@/lib/badge-styles";
import { ADMIN_LINKS_META, SERVICE_STATUS_LABELS } from "@/constants";
import { getStatusServices, type AdminLinks, type Finances, type StatusResponse } from "@/types";

function serviceStatusBadge(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "ok") {
    return {
      label: SERVICE_STATUS_LABELS.ok,
      variant: "outline" as const,
      className: BADGE_STYLES.success,
    };
  }

  if (normalized === "error") {
    return {
      label: SERVICE_STATUS_LABELS.error,
      variant: "destructive" as const,
      className: undefined,
    };
  }

  return {
    label: SERVICE_STATUS_LABELS[normalized] ?? status,
    variant: "outline" as const,
    className: BADGE_STYLES.warning,
  };
}

function formatCurrency(value: number, currency: string): string {
  const code = currency.toUpperCase() === "RUB" ? "RUB" : currency.toUpperCase();
  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toLocaleString("ru-RU")} ${currency}`;
  }
}

function formatHoursLeft(hours: number): string {
  if (hours < 24) {
    return `${hours} ч`;
  }

  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  if (!restHours) {
    return `${days} дн.`;
  }

  return `${days} дн. ${restHours} ч`;
}

export function MonitoringPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [links, setLinks] = useState<AdminLinks | null>(null);
  const [finances, setFinances] = useState<Finances | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    await Promise.all([
      fetchStatus()
        .then(setStatus)
        .catch((error) => {
          setStatus(null);
          toast.error(getApiErrorMessage(error, "Не удалось загрузить статус сервисов"));
        }),
      fetchAdminLinks()
        .then(setLinks)
        .catch((error) => {
          setLinks(null);
          toast.error(getApiErrorMessage(error, "Не удалось загрузить ссылки на панели"));
        }),
      fetchFinances()
        .then(setFinances)
        .catch((error) => {
          setFinances(null);
          toast.error(getApiErrorMessage(error, "Не удалось загрузить финансы TimeWeb"));
        }),
    ]);

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <SectionCard
        title="Статусы"
        extra={
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={loading ? "animate-spin" : undefined} />
            Обновить
          </Button>
        }
      >
        {status ? (
          <div className="flex flex-col gap-3">
            {getStatusServices(status).map(([name, item]) => {
              const badge = serviceStatusBadge(item.status);

              return (
                <div key={name} className="flex flex-wrap items-center gap-2">
                  <Badge variant={badge.variant} className={cn(badge.className)}>
                    {badge.label}
                  </Badge>
                  <span className="font-medium">{name}</span>
                  {item.status === "ok" && item.version ? <span className="text-sm text-muted-foreground">· v{item.version}</span> : null}
                </div>
              );
            })}
          </div>
        ) : null}
        {!status && loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="Баланс сервера">
        {finances ? (
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <p className="text-sm text-muted-foreground">
              Баланс: <span className="font-semibold text-foreground">{formatCurrency(finances.balance, finances.currency)}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Осталось: <span className="font-semibold text-foreground">{formatHoursLeft(finances.hours_left)}</span>
            </p>
          </div>
        ) : null}
        {!finances && loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="Ссылки">
        {links ? (
          <div className="flex flex-col gap-4">
            {ADMIN_LINKS_META.map(({ key, title, hint }) => (
              <Card key={key} className="min-w-0">
                <CardHeader>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{hint}</CardDescription>
                </CardHeader>
                <CardFooter className="min-w-0 items-start">
                  <a href={links[key]} target="_blank" rel="noreferrer" className="flex min-w-0 w-full items-start gap-1.5 text-sm text-primary hover:underline">
                    <ExternalLink className="mt-0.5 size-3.5 shrink-0" />
                    <span className="min-w-0 break-all">{links[key]}</span>
                  </a>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : null}
        {!links && loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}
