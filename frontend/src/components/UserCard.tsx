import { useEffect, useState } from "react";
import { Ellipsis, Eye, Link, Loader2, Pencil, StickyNote, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MARK_MAX_LENGTH, ROLE_LABELS } from "@/constants";
import type { AdminUser, UserRole } from "@/types";

import { CopyableInput } from "@/components/CopyableInput";
import { SubscriptionLink } from "@/components/SubscriptionLink";

type RoleOption = {
  value: UserRole;
  label: string;
};

type EditMode = "none" | "role" | "mark";
type PendingConfirm = "refresh" | "delete" | null;

type UserCardProps = {
  user: AdminUser;
  roleOptions?: RoleOption[];
  actionUserId?: number | null;
  onView?: (user: AdminUser) => void;
  onDelete?: (id: number) => void;
  onRefreshLink?: (id: number) => Promise<string>;
  onUpdateRole?: (id: number, role: "user" | "admin") => Promise<{ user: AdminUser; authLink: string }>;
  onUpdateMark?: (id: number, mark: string) => Promise<void>;
};

export function UserCard({
  user,
  roleOptions = [],
  actionUserId = null,
  onView,
  onDelete,
  onRefreshLink,
  onUpdateRole,
  onUpdateMark,
}: UserCardProps) {
  const [editMode, setEditMode] = useState<EditMode>("none");
  const [selectedRole, setSelectedRole] = useState<"user" | "admin">(user.role === "admin" ? "admin" : "user");
  const [markValue, setMarkValue] = useState(user.mark);
  const [authLink, setAuthLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);

  const isActionLoading = actionUserId === user.id;
  const canManage = user.role !== "superuser";
  const canEditRole =
    canManage &&
    Boolean(onUpdateRole) &&
    roleOptions.length > 0 &&
    !(user.role === "admin" && !roleOptions.some((option) => option.value === "admin"));
  const canEditMark = canManage && Boolean(onUpdateMark);
  const editing = editMode !== "none";
  const showActions = Boolean(onView || onDelete || onRefreshLink || canEditRole || canEditMark);

  useEffect(() => {
    setEditMode("none");
    setAuthLink("");
    setPendingConfirm(null);
    setSelectedRole(user.role === "admin" ? "admin" : "user");
    setMarkValue(user.mark);
  }, [user.id, user.role, user.mark]);

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

    setSaving(true);

    try {
      const result = await onUpdateRole(user.id, selectedRole);
      setAuthLink(result.authLink);
      setEditMode("none");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMark = async () => {
    if (!onUpdateMark) {
      return;
    }

    if (markValue.length > MARK_MAX_LENGTH) {
      return;
    }

    setSaving(true);

    try {
      await onUpdateMark(user.id, markValue.trim());
      setEditMode("none");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditMode("none");
    setSelectedRole(user.role === "admin" ? "admin" : "user");
    setMarkValue(user.mark);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{user.username}</CardTitle>
        {showActions ? (
          <CardAction>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Действия"
                  disabled={editing || isActionLoading}
                >
                  {isActionLoading ? <Loader2 className="animate-spin" /> : <Ellipsis />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {onView ? (
                  <DropdownMenuItem onClick={() => onView(user)}>
                    <Eye />
                    Просмотр
                  </DropdownMenuItem>
                ) : null}
                {canEditRole && !editing ? (
                  <DropdownMenuItem onClick={() => setEditMode("role")}>
                    <Pencil />
                    Изменить роль
                  </DropdownMenuItem>
                ) : null}
                {canEditMark && !editing ? (
                  <DropdownMenuItem onClick={() => setEditMode("mark")}>
                    <StickyNote />
                    Изменить заметку
                  </DropdownMenuItem>
                ) : null}
                {onRefreshLink && canManage ? (
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      setPendingConfirm("refresh");
                    }}
                  >
                    <Link />
                    Новая ссылка для входа
                  </DropdownMenuItem>
                ) : null}
                {onDelete && canManage ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={(event) => {
                        event.preventDefault();
                        setPendingConfirm("delete");
                      }}
                    >
                      <Trash2 />
                      Удалить
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={pendingConfirm === "refresh"} onOpenChange={(open) => !open && setPendingConfirm(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Получить новую ссылку для входа?</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Нет</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void handleRefreshLink().finally(() => setPendingConfirm(null))}>
                    Да
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={pendingConfirm === "delete"} onOpenChange={(open) => !open && setPendingConfirm(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Нет</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() => {
                      onDelete?.(user.id);
                      setPendingConfirm(null);
                    }}
                  >
                    Да
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p>
            ID: <span className="font-semibold text-foreground">{user.id}</span>
          </p>
          {editMode !== "role" ? (
            <p>
              Роль: <span className="font-semibold text-foreground">{ROLE_LABELS[user.role]}</span>
            </p>
          ) : null}
          {editMode === "none" ? (
            <p>
              Код регистрации:{" "}
              <span className="font-semibold text-foreground">{user.registration_code ?? "—"}</span>
            </p>
          ) : null}
          {editMode !== "mark" ? (
            <p>
              Заметка: <span className="font-semibold text-foreground">{user.mark || "—"}</span>
            </p>
          ) : null}
          {editMode === "none" && user.sub_url ? <SubscriptionLink href={user.sub_url} /> : null}
        </div>
        {editMode === "role" ? (
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
        {editMode === "mark" ? (
          <div className="mt-3 flex flex-col gap-2">
            <Label htmlFor={`mark-${user.id}`}>Заметка</Label>
            <Input
              id={`mark-${user.id}`}
              value={markValue}
              maxLength={MARK_MAX_LENGTH}
              onChange={(event) => setMarkValue(event.target.value)}
            />
          </div>
        ) : null}
      </CardContent>
      {editMode === "role" || editMode === "mark" ? (
        <CardFooter className="gap-2">
          <Button
            type="button"
            disabled={saving || isActionLoading}
            onClick={() => void (editMode === "role" ? handleSaveRole() : handleSaveMark())}
          >
            {saving || isActionLoading ? <Loader2 className="animate-spin" /> : null}
            Сохранить
          </Button>
          <Button type="button" variant="outline" onClick={cancelEdit}>
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
