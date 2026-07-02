import { useEffect, useState } from "react";
import { Info, Loader2, Pencil, RotateCcw, Trash2, Wifi } from "lucide-react";

import { formatDate, formatExpiryRemaining } from "@/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatLimitIps, formatTraffic } from "@/utils/format";
import { dateExpiryTagColor, formatDateExpiryRemaining } from "@/utils/jwt";
import type { AccessLevel, XuiClient } from "@/types";

import { CopyableInput } from "@/components/CopyableInput";
import { ActionIconTooltip } from "@/components/ActionIconTooltip";
import { CardTitleWithIcon } from "@/components/CardTitleWithIcon";
import { HintTooltip } from "@/components/HintTooltip";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const LIMIT_IP_HINT =
  "Лимит IP — это не число устройств. С одного IP могут подключаться несколько устройств. Ограничение действует на количество разных IP-адресов одновременно.";

type XuiUpdatePayload = {
  expiry_time_days: number;
  enable: boolean;
};

type XuiClientCardProps = {
  client: XuiClient;
  access?: AccessLevel;
  defaultExpiryDays?: number;
  actionLoading?: boolean;
  className?: string;
  onUpdate?: (email: string, payload: XuiUpdatePayload) => Promise<void>;
  onResetTraffic?: (email: string) => Promise<void>;
  onDelete?: (email: string) => Promise<void>;
};

function subscriptionStatus(client: XuiClient, access: AccessLevel) {
  if (access === "admin") {
    return {
      color: client.enable ? ("success" as const) : ("error" as const),
      label: client.enable ? "Включён" : "Выключен",
    };
  }

  if (!client.enable) {
    return { color: "error" as const, label: "Выключена" };
  }

  const remaining = formatDateExpiryRemaining(client.expiry_datetime);
  if (!remaining || remaining === "истекла") {
    return { color: "error" as const, label: "Истекла" };
  }

  return {
    color: dateExpiryTagColor(client.expiry_datetime),
    label: `Активна ${remaining}`,
  };
}

function statusBadgeClassName(color: "success" | "error" | "default") {
  if (color === "success") {
    return "border-green-600/20 bg-green-600/10 text-green-700 dark:text-green-400";
  }

  if (color === "error") {
    return "";
  }

  return "bg-secondary text-secondary-foreground";
}

function CardTitleContent({ access, email }: { access: AccessLevel; email: string }) {
  if (access === "admin") {
    return <span>{email}</span>;
  }

  return <CardTitleWithIcon icon={Wifi}>Подписка</CardTitleWithIcon>;
}

function SubUrlBlock({ access, subUrl }: { access: AccessLevel; subUrl: string }) {
  const hint = access === "admin" ? "Ссылка подписки" : "Добавьте ссылку в VPN-клиент для подключения";

  if (access === "user") {
    return (
      <div className="flex w-full flex-col gap-3">
        <Alert>
          <Info />
          <AlertDescription className="text-foreground">{hint}</AlertDescription>
        </Alert>
        <CopyableInput value={subUrl} buttonVariant="icon" />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <p className="text-sm font-semibold">{hint}</p>
      <CopyableInput value={subUrl} buttonVariant="icon" />
    </div>
  );
}

export function XuiClientCard({
  client,
  access = "admin",
  defaultExpiryDays = 30,
  actionLoading = false,
  className,
  onUpdate,
  onResetTraffic,
  onDelete,
}: XuiClientCardProps) {
  const [editing, setEditing] = useState(false);
  const [expiryDays, setExpiryDays] = useState(defaultExpiryDays);
  const [enabled, setEnabled] = useState(client.enable);
  const [saving, setSaving] = useState(false);

  const isAdmin = access === "admin";
  const expiryRemaining = formatExpiryRemaining(client.expiry_datetime);
  const status = subscriptionStatus(client, access);
  const showActions = Boolean(onUpdate || onResetTraffic || onDelete);

  useEffect(() => {
    setEditing(false);
    setEnabled(client.enable);
    setExpiryDays(defaultExpiryDays);
  }, [client.email, client.enable, defaultExpiryDays]);

  const handleSave = async () => {
    if (!onUpdate) {
      return;
    }

    setSaving(true);

    try {
      await onUpdate(client.email, {
        expiry_time_days: expiryDays,
        enable: enabled,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={cn("flex h-full flex-col", className)}>
      <CardHeader>
        <CardTitle>
          <CardTitleContent access={access} email={client.email} />
        </CardTitle>
        {isAdmin && expiryRemaining ? <CardDescription>Осталось: {expiryRemaining}</CardDescription> : null}
        <CardAction>
          <div className="flex flex-wrap items-center gap-1">
            <Badge
              variant={status.color === "error" ? "destructive" : "outline"}
              className={cn(status.color !== "error" && statusBadgeClassName(status.color))}
            >
              {status.label}
            </Badge>
            {showActions ? (
              <>
                {onUpdate && !editing ? (
                  <ActionIconTooltip label="Срок и статус подписки">
                    <Button type="button" variant="outline" size="icon-sm" aria-label="Редактировать" onClick={() => setEditing(true)}>
                      <Pencil />
                    </Button>
                  </ActionIconTooltip>
                ) : null}
                {onResetTraffic ? (
                  <AlertDialog>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialogTrigger asChild>
                          <Button type="button" variant="outline" size="icon-sm" aria-label="Сбросить трафик" disabled={actionLoading}>
                            {actionLoading ? <Loader2 className="animate-spin" /> : <RotateCcw />}
                          </Button>
                        </AlertDialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="top">Сбросить трафик</TooltipContent>
                    </Tooltip>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Сбросить трафик?</AlertDialogTitle>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Нет</AlertDialogCancel>
                        <AlertDialogAction onClick={() => void onResetTraffic(client.email)}>Да</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : null}
                {onDelete ? (
                  <AlertDialog>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialogTrigger asChild>
                          <Button type="button" variant="outline" size="icon-sm" aria-label="Удалить" disabled={actionLoading}>
                            {actionLoading ? <Loader2 className="animate-spin" /> : <Trash2 />}
                          </Button>
                        </AlertDialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="top">Удалить</TooltipContent>
                    </Tooltip>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Удалить XUI-клиента?</AlertDialogTitle>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Нет</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={() => void onDelete(client.email)}>
                          Да
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : null}
              </>
            ) : null}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`expiry-${client.email}`}>Срок действия, дней</Label>
              <Input
                id={`expiry-${client.email}`}
                type="number"
                min={1}
                value={expiryDays}
                onChange={(event) => setExpiryDays(Number(event.target.value) || defaultExpiryDays)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Включён</Label>
              <Select value={enabled ? "true" : "false"} onValueChange={(value) => setEnabled(value === "true")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Да</SelectItem>
                  <SelectItem value="false">Нет</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p>
              Трафик: <span className="font-semibold text-foreground">{formatTraffic(client.used_traffic, client.total_gb)}</span>
            </p>
            {!isAdmin ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <p>
                  Лимит IP: <span className="font-semibold text-foreground">{formatLimitIps(client.limit_ips)}</span>
                </p>
                <HintTooltip title={LIMIT_IP_HINT} />
              </div>
            ) : null}
            <p>
              Действует до: <span className="font-semibold text-foreground">{formatDate(client.expiry_datetime)}</span>
            </p>
            {client.sub_url ? <SubUrlBlock access={access} subUrl={client.sub_url} /> : null}
          </div>
        )}
      </CardContent>
      {editing ? (
        <CardFooter className="gap-2">
          <Button type="button" disabled={saving || actionLoading} onClick={() => void handleSave()}>
            {saving || actionLoading ? <Loader2 className="animate-spin" /> : null}
            Сохранить
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setEditing(false);
              setEnabled(client.enable);
              setExpiryDays(defaultExpiryDays);
            }}
          >
            Отмена
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
