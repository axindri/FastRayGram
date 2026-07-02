import { useEffect, useState } from "react";
import { Eye, Link, Loader2, Pencil, Trash2 } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_LABELS, type AdminUser, type UserRole } from "@/types";

import { CopyableInput } from "@/components/CopyableInput";
import { ActionIconTooltip } from "@/components/ActionIconTooltip";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
                <AlertDialog>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertDialogTrigger asChild>
                        <Button type="button" variant="outline" size="icon-sm" aria-label="Обновить ссылку" disabled={isActionLoading}>
                          {isActionLoading ? <Loader2 className="animate-spin" /> : <Link />}
                        </Button>
                      </AlertDialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top">Новая ссылка для входа</TooltipContent>
                  </Tooltip>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Получить новую ссылку для входа?</AlertDialogTitle>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Нет</AlertDialogCancel>
                        <AlertDialogAction onClick={() => void handleRefreshLink()}>Да</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              ) : null}
              {onDelete && canManage ? (
                <AlertDialog>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertDialogTrigger asChild>
                        <Button type="button" variant="outline" size="icon-sm" aria-label="Удалить" disabled={isActionLoading}>
                          {isActionLoading ? <Loader2 className="animate-spin" /> : <Trash2 />}
                        </Button>
                      </AlertDialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top">Удалить</TooltipContent>
                  </Tooltip>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Нет</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={() => onDelete(user.id)}>
                        Да
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
          {!editing && user.mark ? <p>Заметка: {user.mark}</p> : null}
          {!editing && user.sub_url ? (
            <a href={user.sub_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline">
              <Link className="size-3.5" />
              <span>Ссылка подписки</span>
            </a>
          ) : null}
        </div>
        {editing ? (
          <div className="flex flex-col gap-2">
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
