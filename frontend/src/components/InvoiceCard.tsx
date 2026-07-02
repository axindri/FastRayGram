import { Ban } from "lucide-react";

import { formatDate } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { invoiceStatusBadge, isInvoiceActive, type AccessLevel, type AdminInvoice, type Invoice } from "@/types";

import { ConfirmIconAction } from "@/components/ConfirmIconAction";
import { CopyableText } from "@/components/CopyableInput";

function InvoiceStatusBadge({ status }: { status: string }) {
  const badge = invoiceStatusBadge(status);

  return (
    <Badge variant={badge.variant} className={cn(badge.className)}>
      {badge.label}
    </Badge>
  );
}

type InvoiceCardProps = {
  item: Invoice | AdminInvoice;
  access?: AccessLevel;
  paymentBlocked?: boolean;
  canRenew?: boolean;
  onCancel?: (id: number) => void;
  cancelLoadingId?: number | null;
};

function isAdminInvoice(item: Invoice | AdminInvoice): item is AdminInvoice {
  return "username" in item && typeof (item as AdminInvoice).username === "string";
}

export function InvoiceCard({
  item,
  access = "admin",
  paymentBlocked = false,
  canRenew = false,
  onCancel,
  cancelLoadingId = null,
}: InvoiceCardProps) {
  const status = String(item.status || "").toLowerCase();
  const isPending = status === "pending";
  const isAdmin = access === "admin";
  const adminItem = isAdmin && isAdminInvoice(item) ? item : null;
  const showPayButton = !isAdmin && isPending && item.confirmation_url && canRenew;
  const canPay = isPending && item.confirmation_url && !paymentBlocked && canRenew;
  const canCancel = isAdmin && isInvoiceActive(status) && Boolean(onCancel);
  const cancelLoading = cancelLoadingId === item.id;

  const title = isAdmin
    ? `#${item.invoice_id}${adminItem ? ` · ${adminItem.amount} ₽` : ""}`
    : `#${item.invoice_id} · ${item.amount} ₽`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction>
          <div className="flex flex-wrap items-center gap-2">
            <InvoiceStatusBadge status={status} />
            {canCancel && onCancel ? (
              <ConfirmIconAction
                label="Отменить оплату"
                title="Отменить счет?"
                ariaLabel="Отменить счёт"
                icon={<Ban />}
                loading={cancelLoading}
                disabled={cancelLoading}
                onConfirm={() => onCancel(item.id)}
              />
            ) : null}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
        {adminItem ? (
          <>
            <CopyableText value={String(adminItem.id)}>Идентификатор (ID): {adminItem.id}</CopyableText>
            <p>Пользователь: {adminItem.username || `ID ${adminItem.user_id}`}</p>
            {adminItem.mark ? <p>Заметка: {adminItem.mark}</p> : null}
            {adminItem.sub_url ? (
              <a href={adminItem.sub_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                Ссылка подписки
              </a>
            ) : null}
          </>
        ) : null}
        <p>Создан: {formatDate(item.created_at)}</p>
        <p>Обновлен: {formatDate(item.updated_at)}</p>
      </CardContent>
      {showPayButton ? (
        <CardFooter>
          <Button asChild disabled={!canPay}>
            <a href={item.confirmation_url} target="_blank" rel="noreferrer">
              Оплатить
            </a>
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
