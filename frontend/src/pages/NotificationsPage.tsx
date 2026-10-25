import { Loader2, Pencil } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { createNotification, fetchAdminNotifications, updateNotification } from "@/api";
import { PaginatedList } from "@/components/PaginatedList";
import { SectionCard } from "@/components/SectionCard";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Paginated, UserNotification } from "@/types";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatDate } from "@/utils/datetime";
import { emptyPaginated } from "@/utils/pagination";

const textareaClassName = cn(
  "flex min-h-24 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
);

type FormState = {
  username: string;
  title: string;
  body: string;
};

type EditFormState = {
  title: string;
  body: string;
};

const emptyForm: FormState = { username: "", title: "", body: "" };

export function NotificationsPage() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [createLoading, setCreateLoading] = useState(false);
  const [items, setItems] = useState<Paginated<UserNotification>>(() => emptyPaginated(20));
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<UserNotification | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({ title: "", body: "" });
  const [editLoading, setEditLoading] = useState(false);

  const loadItems = useCallback(
    async (page: number) => {
      setLoading(true);
      try {
        setItems(await fetchAdminNotifications(page, items.limit));
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Не удалось загрузить уведомления"));
      } finally {
        setLoading(false);
      }
    },
    [items.limit],
  );

  useEffect(() => {
    void loadItems(1);
  }, [loadItems]);

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const username = form.username.trim();
    const title = form.title.trim();
    const body = form.body.trim();

    if (!username || !title || !body) {
      toast.error("Заполните имя пользователя, заголовок и текст");
      return;
    }

    setCreateLoading(true);
    try {
      await createNotification({ username, title, body });
      setForm(emptyForm);
      toast.success("Уведомление создано");
      await loadItems(1);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось создать уведомление"));
    } finally {
      setCreateLoading(false);
    }
  };

  const openEdit = (item: UserNotification) => {
    setEditing(item);
    setEditForm({ title: item.title, body: item.body });
  };

  const onSaveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) {
      return;
    }

    const title = editForm.title.trim();
    const body = editForm.body.trim();
    if (!title || !body) {
      toast.error("Заполните заголовок и текст");
      return;
    }

    setEditLoading(true);
    try {
      await updateNotification(editing.id, { title, body });
      toast.success("Уведомление обновлено");
      setEditing(null);
      await loadItems(items.page);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось обновить уведомление"));
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <SectionCard title="Создать уведомление" hint="Укажите имя пользователя, которому отправить сообщение">
        <form className="flex flex-col gap-4" onSubmit={onCreate}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notification-username">Имя пользователя</Label>
            <Input
              id="notification-username"
              value={form.username}
              maxLength={32}
              autoComplete="off"
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notification-title">Заголовок</Label>
            <Input
              id="notification-title"
              value={form.title}
              maxLength={200}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notification-body">Текст</Label>
            <textarea
              id="notification-body"
              className={textareaClassName}
              value={form.body}
              maxLength={4000}
              rows={4}
              onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
            />
          </div>
          <Button type="submit" disabled={createLoading}>
            {createLoading ? <Loader2 className="animate-spin" /> : null}
            Создать
          </Button>
        </form>
      </SectionCard>

      <PaginatedList
        page={items.page}
        pages={items.pages}
        total={items.total}
        loading={loading}
        empty={!items.items.length}
        emptyDescription="Уведомлений пока нет"
        entity="уведомлений"
        onPageChange={(page) => void loadItems(page)}
      >
        {items.items.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle className="text-base">{item.title}</CardTitle>
              <CardAction>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Изменить"
                  onClick={() => openEdit(item)}
                >
                  <Pencil />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Пользователь: <span className="text-foreground">{item.username}</span>
              </p>
              <p className="select-text whitespace-pre-wrap text-foreground">{item.body}</p>
              <p>Создано: {formatDate(item.created_at)}</p>
            </CardContent>
          </Card>
        ))}
      </PaginatedList>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Изменить уведомление</DialogTitle>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={onSaveEdit}>
            {editing ? (
              <p className="text-sm text-muted-foreground">
                Пользователь: <span className="text-foreground">{editing.username}</span>
              </p>
            ) : null}
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-notification-title">Заголовок</Label>
              <Input
                id="edit-notification-title"
                value={editForm.title}
                maxLength={200}
                onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-notification-body">Текст</Label>
              <textarea
                id="edit-notification-body"
                className={textareaClassName}
                value={editForm.body}
                maxLength={4000}
                rows={4}
                onChange={(event) => setEditForm((prev) => ({ ...prev, body: event.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Отмена
              </Button>
              <Button type="submit" disabled={editLoading}>
                {editLoading ? <Loader2 className="animate-spin" /> : null}
                Сохранить
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
