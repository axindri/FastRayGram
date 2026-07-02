import { useEffect, useState } from "react";
import { DeleteOutlined, EditOutlined, ReloadOutlined, WifiOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Flex, InputNumber, Popconfirm, Select, Space, Tag, Typography } from "antd";

import { formatDate, formatExpiryRemaining } from "../api";
import { dateExpiryTagColor, formatDateExpiryRemaining } from "../utils/jwt";
import { HintTooltip } from "./HintTooltip";
import { ThemedIconAvatar } from "./ThemedIconAvatar";
import { CopyableInput } from "./CopyableInput";
import { formatLimitIps, formatTraffic } from "../utils/format";
import type { XuiClient } from "../types";

const { Text } = Typography;

const LIMIT_IP_HINT = "Лимит IP — это не число устройств. С одного IP могут подключаться несколько устройств. Ограничение действует на количество разных IP-адресов одновременно.";

type XuiUpdatePayload = {
  expiry_time_days: number;
  enable: boolean;
};

type XuiClientCardProps = {
  client: XuiClient;
  variant?: "admin" | "profile";
  defaultExpiryDays?: number;
  actionLoading?: boolean;
  onUpdate?: (email: string, payload: XuiUpdatePayload) => Promise<void>;
  onResetTraffic?: (email: string) => Promise<void>;
  onDelete?: (email: string) => Promise<void>;
};

const TAG_LABELS = {
  admin: { enabled: "Включён", disabled: "Выключен" },
} as const;

function subscriptionStatusExtra(client: XuiClient, variant: "admin" | "profile") {
  if (variant === "admin") {
    const labels = TAG_LABELS.admin;
    return {
      color: client.enable ? "green" : "red",
      label: client.enable ? labels.enabled : labels.disabled,
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

const SUB_URL_HINTS = {
  admin: "Ссылка подписки",
  profile: "Добавьте ссылку в VPN-клиент для подключения",
} as const;

function CardTitle({ variant, email }: { variant: "admin" | "profile"; email: string }) {
  if (variant === "admin") {
    return <span>{email}</span>;
  }

  return (
    <Flex align="center" gap={8}>
      <ThemedIconAvatar shape="square" size="small" icon={<WifiOutlined />} />
      <span>Подписка</span>
    </Flex>
  );
}

export function XuiClientCard({
  client,
  variant = "admin",
  defaultExpiryDays = 30,
  actionLoading = false,
  onUpdate,
  onResetTraffic,
  onDelete,
}: XuiClientCardProps) {
  const [editing, setEditing] = useState(false);
  const [expiryDays, setExpiryDays] = useState(defaultExpiryDays);
  const [enabled, setEnabled] = useState(client.enable);
  const [saving, setSaving] = useState(false);

  const expiryRemaining = formatExpiryRemaining(client.expiry_datetime);
  const statusExtra = subscriptionStatusExtra(client, variant);
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
    <Card
      title={<CardTitle variant={variant} email={client.email} />}
      extra={
        <Space wrap>
          <Tag color={statusExtra.color} style={{ marginInlineStart: 4 }}>
            {statusExtra.label}
          </Tag>
          {showActions ? (
            <>
              {onUpdate && !editing ? <Button size="small" icon={<EditOutlined />} onClick={() => setEditing(true)} /> : null}
              {onResetTraffic ? (
                <Popconfirm title="Сбросить трафик?" onConfirm={() => void onResetTraffic(client.email)}>
                  <Button size="small" loading={actionLoading} icon={<ReloadOutlined />} />
                </Popconfirm>
              ) : null}
              {onDelete ? (
                <Popconfirm title="Удалить XUI-клиента?" onConfirm={() => void onDelete(client.email)}>
                  <Button size="small" loading={actionLoading} icon={<DeleteOutlined />} />
                </Popconfirm>
              ) : null}
            </>
          ) : null}
        </Space>
      }
    >
      {editing ? (
        <Space orientation="vertical" size={12} style={{ width: "100%" }}>
          <div>
            <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
              Срок действия, дней
            </Text>
            <InputNumber min={1} value={expiryDays} onChange={(value) => setExpiryDays(value ?? defaultExpiryDays)} style={{ width: "100%" }} />
          </div>
          <div>
            <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
              Включён
            </Text>
            <Select
              value={enabled}
              onChange={setEnabled}
              style={{ width: "100%" }}
              options={[
                { value: true, label: "Да" },
                { value: false, label: "Нет" },
              ]}
            />
          </div>
          <Space wrap>
            <Button type="primary" loading={saving || actionLoading} onClick={() => void handleSave()}>
              Сохранить
            </Button>
            <Button
              onClick={() => {
                setEditing(false);
                setEnabled(client.enable);
                setExpiryDays(defaultExpiryDays);
              }}
            >
              Отмена
            </Button>
          </Space>
        </Space>
      ) : (
        <Space orientation="vertical" size={12} style={{ width: "100%" }}>
          <Text>
            Трафик: <Text strong>{formatTraffic(client.used_traffic, client.total_gb)}</Text>
          </Text>
          {variant === "profile" ? (
            <Flex align="center" gap={6} wrap>
              <Text>
                Лимит IP: <Text strong>{formatLimitIps(client.limit_ips)}</Text>
              </Text>
              <HintTooltip title={LIMIT_IP_HINT} />
            </Flex>
          ) : null}
          <Text>
            Действует до: {formatDate(client.expiry_datetime)}
            {variant === "admin" && expiryRemaining ? ` · ${expiryRemaining}` : null}
          </Text>

          {client.sub_url ? (
            <div style={{ marginTop: 4 }}>
              <SubUrlBlock hint={SUB_URL_HINTS[variant]} subUrl={client.sub_url} prominent={variant === "profile"} />
            </div>
          ) : null}
        </Space>
      )}
    </Card>
  );
}

function SubUrlBlock({ hint, subUrl, prominent = false }: { hint: string; subUrl: string; prominent?: boolean }) {
  if (prominent) {
    return (
      <Space orientation="vertical" size={12} style={{ width: "100%" }}>
        <Alert type="info" showIcon title={hint} />
        <CopyableInput value={subUrl} buttonVariant="icon" />
      </Space>
    );
  }

  return (
    <>
      <Text style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>{hint}</Text>
      <CopyableInput value={subUrl} buttonVariant="icon" />
    </>
  );
}
