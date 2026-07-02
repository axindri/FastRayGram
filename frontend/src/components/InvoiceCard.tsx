import { Ban, Loader2 } from "lucide-react";

import { formatDate } from "@/api";
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
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { invoiceStatusBadge, isInvoiceActive, type AccessLevel, type AdminInvoice, type Invoice } from "@/types";

import { CopyableText } from "@/components/CopyableInput";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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

function CancelInvoiceButton({
  invoiceId,
  loading,
  onCancel,
}: {
  invoiceId: number;
  loading: boolean;
  onCancel: (id: number) => void;
}) {
  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline" size="icon-sm" aria-label="Отменить счёт" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Ban />}
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">Отменить оплату</TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Отменить счет?</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Нет</AlertDialogCancel>
          <AlertDialogAction onClick={() => onCancel(invoiceId)}>Да</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
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
              <CancelInvoiceButton invoiceId={item.id} loading={cancelLoading} onCancel={onCancel} />
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
