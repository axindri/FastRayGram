import { Bell, Eye } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchMyNotifications } from "@/api";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/datetime";
import {
  APP_LAST_READ_KEY,
  PROFILE_LAST_READ_KEY,
  countUnreadFeed,
  fetchChangelog,
  getFeedLastReadId,
  isFeedItemUnread,
  setFeedLastReadId,
  type FeedItem,
} from "@/utils/changelog";

function hasTextSelection(): boolean {
  const selection = window.getSelection();
  return Boolean(selection && selection.toString().length > 0);
}

type FeedTab = "profile" | "app";

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

function FeedList({
  items,
  lastReadId,
  loading,
  emptyText,
  dateLabel,
  onReadUntil,
}: {
  items: FeedItem[];
  lastReadId: string | null;
  loading: boolean;
  emptyText: string;
  dateLabel: (item: FeedItem) => string;
  onReadUntil: (id: string) => void;
}) {
  if (loading) {
    return <p className="px-3 py-6 text-center text-sm text-muted-foreground">Загрузка…</p>;
  }

  if (!items.length) {
    return <p className="px-3 py-6 text-center text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <ul className="divide-y">
      {items.map((item) => {
        const unread = isFeedItemUnread(items, item.id, lastReadId);

        return (
          <li key={item.id}>
            <div
              role="button"
              tabIndex={0}
              className="w-full cursor-default select-text px-3 py-3 text-left transition hover:bg-muted/50"
              onClick={() => {
                if (hasTextSelection()) {
                  return;
                }
                onReadUntil(item.id);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onReadUntil(item.id);
                }
              }}
            >
              <div className="flex items-start gap-2">
                <span
                  className={cn("mt-1.5 size-2 shrink-0 rounded-full", unread ? "bg-primary" : "bg-transparent")}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                    <p className={cn("text-sm font-medium", unread && "text-foreground")}>{item.title}</p>
                    <span className="text-xs text-muted-foreground">{dateLabel(item)}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{item.body}</p>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function UpdatesBell() {
  const [tab, setTab] = useState<FeedTab>("profile");
  const [profileItems, setProfileItems] = useState<FeedItem[]>([]);
  const [appItems, setAppItems] = useState<FeedItem[]>([]);
  const [profileLastReadId, setProfileLastReadId] = useState<string | null>(() => getFeedLastReadId(PROFILE_LAST_READ_KEY));
  const [appLastReadId, setAppLastReadId] = useState<string | null>(() => getFeedLastReadId(APP_LAST_READ_KEY));
  const [open, setOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [appLoading, setAppLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const rows = await fetchMyNotifications();
      setProfileItems(
        rows.map((row) => ({
          id: String(row.id),
          date: row.created_at,
          title: row.title,
          body: row.body,
        })),
      );
    } catch {
      setProfileItems([]);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const loadApp = useCallback(async () => {
    setAppLoading(true);
    try {
      setAppItems(await fetchChangelog());
    } catch {
      setAppItems([]);
    } finally {
      setAppLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
    void loadApp();
  }, [loadApp, loadProfile]);

  useEffect(() => {
    if (open) {
      void loadProfile();
    }
  }, [loadProfile, open]);

  const profileUnread = countUnreadFeed(profileItems, profileLastReadId);
  const appUnread = countUnreadFeed(appItems, appLastReadId);
  const totalUnread = profileUnread + appUnread;

  const activeItems = tab === "profile" ? profileItems : appItems;
  const activeUnread = tab === "profile" ? profileUnread : appUnread;
  const activeNewestId = activeItems[0]?.id;

  const markAllRead = useCallback(() => {
    if (!activeNewestId) {
      return;
    }
    if (tab === "profile") {
      setFeedLastReadId(PROFILE_LAST_READ_KEY, activeNewestId);
      setProfileLastReadId(activeNewestId);
      return;
    }
    setFeedLastReadId(APP_LAST_READ_KEY, activeNewestId);
    setAppLastReadId(activeNewestId);
  }, [activeNewestId, tab]);

  const readUntil = useCallback(
    (id: string) => {
      if (tab === "profile") {
        setFeedLastReadId(PROFILE_LAST_READ_KEY, id);
        setProfileLastReadId(id);
        return;
      }
      setFeedLastReadId(APP_LAST_READ_KEY, id);
      setAppLastReadId(id);
    },
    [tab],
  );

  const badgeLabel = useMemo(() => {
    if (!totalUnread) {
      return "Уведомления";
    }
    return `Уведомления, непрочитанных: ${totalUnread}`;
  }, [totalUnread]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
          aria-label={badgeLabel}
        >
          <Bell className="size-5" />
          {totalUnread > 0 ? (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" aria-hidden />
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 sm:w-96">
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
          <p className="text-sm font-semibold">Уведомления</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2"
            disabled={!activeNewestId || activeUnread === 0}
            onClick={markAllRead}
            aria-label="Посмотреть все"
            title="Посмотреть все"
          >
            <Eye className="size-4" />
            Посмотреть все
          </Button>
        </div>

        <Tabs value={tab} onValueChange={(value) => setTab(value as FeedTab)} className="gap-0">
          <div className="border-b px-2 pt-2">
            <TabsList variant="line" className="w-full justify-start">
              <TabsTrigger value="profile" className="gap-1.5">
                Профиль
                {profileUnread > 0 ? <span className="size-1.5 rounded-full bg-destructive" aria-hidden /> : null}
              </TabsTrigger>
              <TabsTrigger value="app" className="gap-1.5">
                Приложение
                {appUnread > 0 ? <span className="size-1.5 rounded-full bg-destructive" aria-hidden /> : null}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="max-h-80 overflow-y-auto">
            <TabsContent value="profile" className="mt-0">
              <FeedList
                items={profileItems}
                lastReadId={profileLastReadId}
                loading={profileLoading}
                emptyText="Пока нет уведомлений"
                dateLabel={(item) => formatDate(item.date)}
                onReadUntil={readUntil}
              />
            </TabsContent>
            <TabsContent value="app" className="mt-0">
              <FeedList
                items={appItems}
                lastReadId={appLastReadId}
                loading={appLoading}
                emptyText="Пока нет обновлений"
                dateLabel={(item) => formatChangelogDate(item.date)}
                onReadUntil={readUntil}
              />
            </TabsContent>
          </div>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
