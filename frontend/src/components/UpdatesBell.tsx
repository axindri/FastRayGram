import { Bell, Eye } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  countUnreadChangelog,
  fetchChangelog,
  getChangelogLastReadId,
  isChangelogItemUnread,
  setChangelogLastReadId,
  type ChangelogItem,
} from "@/utils/changelog";

function formatChangelogDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function UpdatesBell() {
  const [items, setItems] = useState<ChangelogItem[]>([]);
  const [lastReadId, setLastReadId] = useState<string | null>(() => getChangelogLastReadId());
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void fetchChangelog()
      .then((next) => {
        if (!cancelled) {
          setItems(next);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const unreadCount = countUnreadChangelog(items, lastReadId);
  const newestId = items[0]?.id;

  const markAllRead = useCallback(() => {
    if (!newestId) {
      return;
    }
    setChangelogLastReadId(newestId);
    setLastReadId(newestId);
  }, [newestId]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
          aria-label={unreadCount ? `Обновления, непрочитанных: ${unreadCount}` : "Обновления"}
        >
          <Bell className="size-5" />
          {unreadCount > 0 ? (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" aria-hidden />
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 sm:w-96">
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
          <p className="text-sm font-semibold">Обновления</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2"
            disabled={!newestId || unreadCount === 0}
            onClick={markAllRead}
            aria-label="Посмотреть все"
            title="Посмотреть все"
          >
            <Eye className="size-4" />
            Посмотреть все
          </Button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Загрузка…</p>
          ) : items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Пока нет обновлений</p>
          ) : (
            <ul className="divide-y">
              {items.map((item) => {
                const unread = isChangelogItemUnread(items, item.id, lastReadId);

                return (
                  <li key={item.id} className="px-3 py-3">
                    <div className="flex items-start gap-2">
                      <span
                        className={cn("mt-1.5 size-2 shrink-0 rounded-full", unread ? "bg-primary" : "bg-transparent")}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                          <p className={cn("text-sm font-medium", unread && "text-foreground")}>{item.title}</p>
                          <span className="text-xs text-muted-foreground">{formatChangelogDate(item.date)}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
