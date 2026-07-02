import { WifiOutlined } from "@ant-design/icons";
import { Alert, Card, Flex, Space, Tag, Typography } from "antd";

import { formatDate, formatExpiryRemaining } from "../api";
import { dateExpiryTagColor, formatDateExpiryRemaining } from "../utils/jwt";
import { HintTooltip } from "./HintTooltip";
import { ThemedIconAvatar } from "./ThemedIconAvatar";
import { CopyableInput } from "./CopyableInput";
import { formatLimitIps, formatTraffic } from "../utils/format";
import type { XuiClient } from "../types";

const { Text } = Typography;

const LIMIT_IP_HINT = "Лимит IP — это не число устройств. С одного IP могут подключаться несколько устройств. Ограничение действует на количество разных IP-адресов одновременно.";

type XuiClientCardProps = {
  client: XuiClient;
  variant?: "admin" | "profile";
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

export function XuiClientCard({ client, variant = "admin" }: XuiClientCardProps) {
  const expiryRemaining = formatExpiryRemaining(client.expiry_datetime);
  const statusExtra = subscriptionStatusExtra(client, variant);

  return (
    <Card
      title={<CardTitle variant={variant} email={client.email} />}
      extra={
        <Tag color={statusExtra.color} style={{ marginInlineStart: 4 }}>
          {statusExtra.label}
        </Tag>
      }
    >
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
