import { useEffect, useState } from "react";
import { Eye, Link, Loader2, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_LABELS } from "@/constants";
import type { AdminUser, UserRole } from "@/types";

import { ActionIconTooltip } from "@/components/ActionIconTooltip";
import { ConfirmIconAction } from "@/components/ConfirmIconAction";
import { CopyableInput } from "@/components/CopyableInput";
import { SubscriptionLink } from "@/components/SubscriptionLink";

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
    <Card>
      <CardHeader>
        <CardTitle>{user.username}</CardTitle>
        {showActions ? (
          <CardAction>
            <div className="flex flex-wrap gap-1">
              {onView ? (
                <ActionIconTooltip label="Просмотр">
                  <Button type="button" variant="outline" size="icon-sm" aria-label="Просмотр" onClick={() => onView(user)}>
                    <Eye />
                  </Button>
                </ActionIconTooltip>
              ) : null}
              {canEditRole && !editing ? (
                <ActionIconTooltip label="Изменить роль">
                  <Button type="button" variant="outline" size="icon-sm" aria-label="Изменить роль" onClick={() => setEditing(true)}>
                    <Pencil />
                  </Button>
                </ActionIconTooltip>
              ) : null}
              {onRefreshLink && canManage ? (
                <ConfirmIconAction
                  label="Новая ссылка для входа"
                  title="Получить новую ссылку для входа?"
                  ariaLabel="Обновить ссылку"
                  icon={<Link />}
                  loading={isActionLoading}
                  disabled={isActionLoading}
                  onConfirm={() => void handleRefreshLink()}
                />
              ) : null}
              {onDelete && canManage ? (
                <ConfirmIconAction
                  label="Удалить"
                  title="Удалить пользователя?"
                  ariaLabel="Удалить"
                  icon={<Trash2 />}
                  loading={isActionLoading}
                  disabled={isActionLoading}
                  destructive
                  onConfirm={() => onDelete(user.id)}
                />
              ) : null}
            </div>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p>
            ID: <span className="font-semibold text-foreground">{user.id}</span>
          </p>
          {!editing ? (
            <p>
              Роль: <span className="font-semibold text-foreground">{ROLE_LABELS[user.role]}</span>
            </p>
          ) : null}
          {!editing && user.mark ? (
            <p>
              Заметка: <span className="font-semibold text-foreground">{user.mark}</span>
            </p>
          ) : null}
          {!editing && user.sub_url ? <SubscriptionLink href={user.sub_url} /> : null}
        </div>
        {editing ? (
          <div className="mt-3 flex flex-col gap-2">
            <Label>Новая роль</Label>
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as "user" | "admin")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </CardContent>
      {editing ? (
        <CardFooter className="gap-2">
          <Button type="button" disabled={roleSaving || isActionLoading} onClick={() => void handleSaveRole()}>
            {roleSaving || isActionLoading ? <Loader2 className="animate-spin" /> : null}
            Сохранить
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setEditing(false);
              setSelectedRole(user.role === "admin" ? "admin" : "user");
            }}
          >
            Отмена
          </Button>
        </CardFooter>
      ) : authLink ? (
        <CardFooter className="flex-col items-stretch gap-2">
          <CopyableInput label="Ссылка для входа" value={authLink} />
        </CardFooter>
      ) : null}
    </Card>
  );
}
