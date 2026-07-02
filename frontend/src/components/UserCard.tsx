import { useEffect, useState } from "react";
import { DeleteOutlined, EditOutlined, EyeOutlined, LinkOutlined } from "@ant-design/icons";
import { Button, Card, Flex, Popconfirm, Select, Space, Typography } from "antd";

import { ROLE_LABELS, type AdminUser, type UserRole } from "../types";
import { CopyableInput } from "./CopyableInput";

const { Text, Link } = Typography;

type RoleOption = {
  value: UserRole;
  label: string;
};

type UserCardProps = {
  user: AdminUser;
  roleOptions?: RoleOption[];
  actionUserId?: number | null;
  onView?: (user: AdminUser) => void;
  onDelete?: (id: number) => void;
  onRefreshLink?: (id: number) => Promise<string>;
  onUpdateRole?: (id: number, role: "user" | "admin") => Promise<{ user: AdminUser; authLink: string }>;
};

export function UserCard({
  user,
  roleOptions = [],
  actionUserId = null,
  onView,
  onDelete,
  onRefreshLink,
  onUpdateRole,
}: UserCardProps) {
  const [editing, setEditing] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"user" | "admin">(user.role === "admin" ? "admin" : "user");
  const [authLink, setAuthLink] = useState("");
  const [roleSaving, setRoleSaving] = useState(false);

  const isActionLoading = actionUserId === user.id;
  const canManage = user.role !== "superuser";
  const canEditRole =
    canManage &&
    Boolean(onUpdateRole) &&
    roleOptions.length > 0 &&
    !(user.role === "admin" && !roleOptions.some((option) => option.value === "admin"));
  const showActions = Boolean(onView || onDelete || onRefreshLink || canEditRole);

  useEffect(() => {
    setEditing(false);
    setAuthLink("");
    setSelectedRole(user.role === "admin" ? "admin" : "user");
  }, [user.id, user.role]);

  const handleRefreshLink = async () => {
    if (!onRefreshLink) {
      return;
    }

    const link = await onRefreshLink(user.id);
    setAuthLink(link);
  };

  const handleSaveRole = async () => {
    if (!onUpdateRole) {
      return;
    }

    setRoleSaving(true);

    try {
      const result = await onUpdateRole(user.id, selectedRole);
      setAuthLink(result.authLink);
      setEditing(false);
    } finally {
      setRoleSaving(false);
    }
  };

  return (
    <Card
      size="small"
      title={user.username}
      extra={
        showActions ? (
          <Space wrap>
            {onView ? <Button size="small" icon={<EyeOutlined />} onClick={() => onView(user)} /> : null}
            {canEditRole && !editing ? <Button size="small" icon={<EditOutlined />} onClick={() => setEditing(true)} /> : null}
            {onRefreshLink && canManage ? (
              <Popconfirm title="Получить новую ссылку для входа?" onConfirm={() => void handleRefreshLink()}>
                <Button size="small" loading={isActionLoading} icon={<LinkOutlined />} />
              </Popconfirm>
            ) : null}
            {onDelete && canManage ? (
              <Popconfirm title="Удалить пользователя?" onConfirm={() => onDelete(user.id)}>
                <Button size="small" loading={isActionLoading} icon={<DeleteOutlined />} />
              </Popconfirm>
            ) : null}
          </Space>
        ) : null
      }
    >
      {editing ? (
        <Space orientation="vertical" size={12} style={{ width: "100%" }}>
          <div>
            <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
              Новая роль
            </Text>
            <Select value={selectedRole} options={roleOptions} onChange={setSelectedRole} style={{ width: "100%" }} />
          </div>
          <Space wrap>
            <Button type="primary" loading={roleSaving || isActionLoading} onClick={() => void handleSaveRole()}>
              Сохранить
            </Button>
            <Button
              onClick={() => {
                setEditing(false);
                setSelectedRole(user.role === "admin" ? "admin" : "user");
              }}
            >
              Отмена
            </Button>
          </Space>
        </Space>
      ) : (
        <Space orientation="vertical" size={4} style={{ width: "100%" }}>
          <Text type="secondary">ID: {user.id}</Text>
          <Text type="secondary">Роль: {ROLE_LABELS[user.role]}</Text>
          {user.mark ? <Text type="secondary">Заметка: {user.mark}</Text> : null}
          {user.sub_url ? (
            <Link href={user.sub_url} target="_blank">
              <Flex align="center" gap={6}>
                <LinkOutlined />
                <span>Ссылка подписки</span>
              </Flex>
            </Link>
          ) : null}
        </Space>
      )}

      {authLink ? (
        <div style={{ marginTop: 12 }}>
          <CopyableInput label="Ссылка для входа" value={authLink} />
        </div>
      ) : null}
    </Card>
  );
}
