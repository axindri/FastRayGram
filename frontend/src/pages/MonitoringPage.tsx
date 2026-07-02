import { ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { fetchAdminLinks, fetchStatus } from "@/api";
import { AdminPageColumn, AdminPageLayout } from "@/components/AdminPageLayout";
import { SectionCard } from "@/components/SectionCard";
import { getApiErrorMessage } from "@/utils/apiError";
import { ADMIN_LINKS_META, SERVICE_STATUS_LABELS } from "@/constants";
import { getStatusServices, type AdminLinks, type StatusResponse } from "@/types";

function serviceStatusBadge(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "ok") {
    return {
      label: SERVICE_STATUS_LABELS.ok,
      variant: "outline" as const,
      className: "border-green-600/25 bg-green-600/10 text-green-700 dark:text-green-400",
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
    className: "border-amber-600/25 bg-amber-600/10 text-amber-800 dark:text-amber-400",
  };
}

export function MonitoringPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [links, setLinks] = useState<AdminLinks | null>(null);
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
    ]);

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminPageLayout title="Мониторинг" description="Статус сервисов и быстрые ссылки на панели">
      <AdminPageColumn span={24}>
        <div className="flex flex-col gap-4">
          <SectionCard
            title="Статус"
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
                      {item.status === "ok" && item.version ? (
                        <span className="text-sm text-muted-foreground">· v{item.version}</span>
                      ) : null}
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
                      <a
                        href={links[key]}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-w-0 w-full items-start gap-1.5 text-sm text-primary hover:underline"
                      >
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
      </AdminPageColumn>
    </AdminPageLayout>
  );
}
