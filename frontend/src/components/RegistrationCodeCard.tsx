import { useState } from "react";
import { DeleteOutlined } from "@ant-design/icons";
import { Button, Card, InputNumber, Popconfirm, Space, Tag, Typography } from "antd";

import { buildRegistrationLink, formatDate } from "../api";
import type { RegistrationCode } from "../types";
import { CopyableInput } from "./CopyableInput";

const { Text } = Typography;

type RegistrationCodeCardProps = {
  item: RegistrationCode;
  onExtend: (id: number, extendDays: number) => void;
  onDelete: (id: number) => void;
  extendLoading?: boolean;
  deleteLoading?: boolean;
};

function codeStatus(item: RegistrationCode): { label: string; color: string } {
  if (new Date(item.expires_at).getTime() <= Date.now()) {
    return { label: "Истёк", color: "red" };
  }

  return { label: "Активен", color: "green" };
}

export function RegistrationCodeCard({ item, onExtend, onDelete, extendLoading = false, deleteLoading = false }: RegistrationCodeCardProps) {
  const [extendDays, setExtendDays] = useState(7);
  const status = codeStatus(item);
  const registrationLink = buildRegistrationLink(item.code);

  return (
    <Card
      size="small"
      title={
        <Space>
          <Text strong>{item.code}</Text>
          <Tag color={status.color}>{status.label} </Tag>
        </Space>
      }
      extra={
        <Space>
          <Popconfirm title="Удалить код регистрации?" onConfirm={() => onDelete(item.id)}>
            <Button size="small" loading={deleteLoading} icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      }
    >
      <Space orientation="vertical" size={8} style={{ width: "100%" }}>
        <Text type="secondary">Действует до: {formatDate(item.expires_at)}</Text>
        <Text type="secondary">Создан: {formatDate(item.created_at)}</Text>

        <Space wrap align="center">
          <InputNumber min={1} max={365} value={extendDays} onChange={(value) => setExtendDays(value ?? 1)} style={{ width: 48 }} />
          <Text type="secondary">дней</Text>
          <Button loading={extendLoading} onClick={() => onExtend(item.id, extendDays)}>
            Продлить
          </Button>
        </Space>
        <CopyableInput label="Ссылка для регистрации" value={registrationLink} />
      </Space>
    </Card>
  );
}
