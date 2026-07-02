import { StopOutlined } from "@ant-design/icons";
import { Button, Card, Popconfirm, Space, Tag, Typography } from "antd";

import { formatDate } from "../api";
import { CopyableText } from "./CopyableInput";
import { INVOICE_STATUS_LABELS, invoiceStatusColor, isInvoiceActive, type AdminInvoice, type Invoice } from "../types";

const { Text, Link } = Typography;

type InvoiceCardProps = {
  item: Invoice | AdminInvoice;
  variant?: "profile" | "admin";
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
  variant = "admin",
  paymentBlocked = false,
  canRenew = false,
  onCancel,
  cancelLoadingId = null,
}: InvoiceCardProps) {
  const status = String(item.status || "").toLowerCase();
  const isPending = status === "pending";
  const adminItem = variant === "admin" && isAdminInvoice(item) ? item : null;
  const showPayButton = variant === "profile" && isPending && item.confirmation_url && canRenew;
  const canPay = isPending && item.confirmation_url && !paymentBlocked && canRenew;
  const canCancel = variant === "admin" && isInvoiceActive(status) && Boolean(onCancel);

  const title =
    variant === "profile"
      ? `#${item.invoice_id} · ${item.amount} ₽`
      : `#${item.invoice_id}${adminItem ? ` · ${adminItem.amount} ₽` : ""}`;

  return (
    <Card
      size="small"
      title={title}
      extra={
        <Space wrap>
          <Tag color={invoiceStatusColor(status)}>{INVOICE_STATUS_LABELS[status] || status || "—"}</Tag>
          {canCancel ? (
            <Popconfirm title="Отменить счет?" onConfirm={() => onCancel?.(item.id)}>
              <Button size="small" loading={cancelLoadingId === item.id} icon={<StopOutlined />} />
            </Popconfirm>
          ) : null}
        </Space>
      }
    >
      <Space orientation="vertical" size={variant === "profile" ? 8 : 4} style={{ width: "100%" }}>
        {adminItem ? (
          <>
            <CopyableText value={String(adminItem.id)}>Идентификатор (ID): {adminItem.id}</CopyableText>
            <Text type="secondary">Пользователь: {adminItem.username || `ID ${adminItem.user_id}`}</Text>
            {adminItem.mark ? <Text type="secondary">Заметка: {adminItem.mark}</Text> : null}
            {adminItem.sub_url ? (
              <Link href={adminItem.sub_url} target="_blank">
                Ссылка подписки
              </Link>
            ) : null}
          </>
        ) : null}
        <Text type="secondary">Создан: {formatDate(item.created_at)}</Text>
        <Text type="secondary">Обновлен: {formatDate(item.updated_at)}</Text>

        {showPayButton ? (
          <Button type="primary" href={item.confirmation_url} target="_blank" rel="noreferrer" disabled={!canPay}>
            Оплатить
          </Button>
        ) : null}
      </Space>
    </Card>
  );
}
