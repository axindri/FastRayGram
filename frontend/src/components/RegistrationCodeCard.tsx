import { useState } from "react";
import { Ban, Loader2 } from "lucide-react";

import { buildRegistrationLink } from "@/api";
import { formatDate, isUtcDatePast } from "@/utils/datetime";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BADGE_STYLES } from "@/lib/badge-styles";
import type { RegistrationCode } from "@/types";

import { ConfirmIconAction } from "@/components/ConfirmIconAction";
import { CopyableInput } from "@/components/CopyableInput";

type RegistrationCodeCardProps = {
  item: RegistrationCode;
  onExtend: (id: number, extendDays: number) => void;
  onDisable: (id: number) => void;
  extendLoading?: boolean;
  disableLoading?: boolean;
};

function codeStatus(item: RegistrationCode): { label: string; active: boolean } {
  if (!item.enable) {
    return { label: "Отключён", active: false };
  }

  if (isUtcDatePast(item.expires_at)) {
    return { label: "Истёк", active: false };
  }

  if (item.max_registrations > 0 && item.registrations_count >= item.max_registrations) {
    return { label: "Исчерпан", active: false };
  }

  return { label: "Активен", active: true };
}

function formatRegistrationLimit(item: RegistrationCode): string {
  if (item.max_registrations === 0) {
    return `${item.registrations_count} / без лимита`;
  }

  return `${item.registrations_count} / ${item.max_registrations}`;
}

export function RegistrationCodeCard({
  item,
  onExtend,
  onDisable,
  extendLoading = false,
  disableLoading = false,
}: RegistrationCodeCardProps) {
  const [extendDays, setExtendDays] = useState(7);
  const status = codeStatus(item);
  const registrationLink = buildRegistrationLink(item.code);
  const isDisabled = !item.enable;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{item.code}</CardTitle>
        <CardAction>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(status.active ? BADGE_STYLES.success : BADGE_STYLES.error)}
            >
              {status.label}
            </Badge>
            {!isDisabled ? (
              <ConfirmIconAction
                label="Отключить"
                title="Отключить код регистрации?"
                ariaLabel="Отключить код"
                icon={<Ban />}
                loading={disableLoading}
                disabled={disableLoading}
                destructive
                onConfirm={() => onDisable(item.id)}
              />
            ) : null}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <p>Действует до: {formatDate(item.expires_at)}</p>
        <p>Регистраций: {formatRegistrationLimit(item)}</p>
        <p>Создан: {formatDate(item.created_at)}</p>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="number"
            min={1}
            max={365}
            value={extendDays}
            onChange={(event) => setExtendDays(Number(event.target.value) || 1)}
            className="w-16"
          />
          <span className="text-sm text-muted-foreground">дней</span>
          <Button
            type="button"
            variant="outline"
            disabled={extendLoading || isDisabled}
            onClick={() => onExtend(item.id, extendDays)}
          >
            {extendLoading ? <Loader2 className="animate-spin" /> : null}
            Продлить
          </Button>
        </div>
        <CopyableInput label="Ссылка для регистрации" value={registrationLink} />
      </CardFooter>
    </Card>
  );
}
