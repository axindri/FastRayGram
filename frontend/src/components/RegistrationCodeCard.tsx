import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

import { buildRegistrationLink, formatDate } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { RegistrationCode } from "@/types";

import { ConfirmIconAction } from "@/components/ConfirmIconAction";
import { CopyableInput } from "@/components/CopyableInput";

type RegistrationCodeCardProps = {
  item: RegistrationCode;
  onExtend: (id: number, extendDays: number) => void;
  onDelete: (id: number) => void;
  extendLoading?: boolean;
  deleteLoading?: boolean;
};

function codeStatus(item: RegistrationCode): { label: string; active: boolean } {
  if (new Date(item.expires_at).getTime() <= Date.now()) {
    return { label: "Истёк", active: false };
  }

  return { label: "Активен", active: true };
}

export function RegistrationCodeCard({
  item,
  onExtend,
  onDelete,
  extendLoading = false,
  deleteLoading = false,
}: RegistrationCodeCardProps) {
  const [extendDays, setExtendDays] = useState(7);
  const status = codeStatus(item);
  const registrationLink = buildRegistrationLink(item.code);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{item.code}</CardTitle>
        <CardAction>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                status.active
                  ? "border-green-600/20 bg-green-600/10 text-green-700 dark:text-green-400"
                  : "border-destructive/20 bg-destructive/10 text-destructive",
              )}
            >
              {status.label}
            </Badge>
            <ConfirmIconAction
              label="Удалить"
              title="Удалить код регистрации?"
              ariaLabel="Удалить код"
              icon={<Trash2 />}
              loading={deleteLoading}
              disabled={deleteLoading}
              destructive
              onConfirm={() => onDelete(item.id)}
            />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <p>Действует до: {formatDate(item.expires_at)}</p>
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
          <Button type="button" variant="outline" disabled={extendLoading} onClick={() => onExtend(item.id, extendDays)}>
            {extendLoading ? <Loader2 className="animate-spin" /> : null}
            Продлить
          </Button>
        </div>
        <CopyableInput label="Ссылка для регистрации" value={registrationLink} />
      </CardFooter>
    </Card>
  );
}
