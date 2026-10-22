export type FeedItem = {
  id: string;
  date: string;
  title: string;
  body: string;
};

export type ChangelogItem = FeedItem;

export const CHANGELOG_URL = "/changelog.json";
export const PROFILE_LAST_READ_KEY = "notificationsProfileLastReadId";
export const APP_LAST_READ_KEY = "notificationsAppLastReadId";
/** @deprecated migrated to APP_LAST_READ_KEY */
const LEGACY_CHANGELOG_KEY = "changelogLastReadId";

export function getFeedLastReadId(storageKey: string): string | null {
  try {
    const value = localStorage.getItem(storageKey);
    if (value) {
      return value;
    }
    if (storageKey === APP_LAST_READ_KEY) {
      return localStorage.getItem(LEGACY_CHANGELOG_KEY);
    }
    return null;
  } catch {
    return null;
  }
}

export function setFeedLastReadId(storageKey: string, id: string): void {
  try {
    localStorage.setItem(storageKey, id);
    if (storageKey === APP_LAST_READ_KEY) {
      localStorage.removeItem(LEGACY_CHANGELOG_KEY);
    }
  } catch {
    // Ignore quota / private mode errors.
  }
}

/** Newest-first feed. Unread = items newer than lastReadId. Clicking an item marks it and older as read. */
export function isFeedItemUnread(items: FeedItem[], itemId: string, lastReadId: string | null): boolean {
  if (!lastReadId) {
    return true;
  }

  const lastReadIndex = items.findIndex((item) => item.id === lastReadId);
  if (lastReadIndex < 0) {
    return true;
  }

  const itemIndex = items.findIndex((item) => item.id === itemId);
  return itemIndex >= 0 && itemIndex < lastReadIndex;
}

export function countUnreadFeed(items: FeedItem[], lastReadId: string | null): number {
  return items.filter((item) => isFeedItemUnread(items, item.id, lastReadId)).length;
}

export async function fetchChangelog(): Promise<ChangelogItem[]> {
  const response = await fetch(`${CHANGELOG_URL}?t=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load changelog: ${response.status}`);
  }

  const data = (await response.json()) as unknown;
  if (!Array.isArray(data)) {
    return [];
  }

  return data.filter((item): item is ChangelogItem => {
    if (!item || typeof item !== "object") {
      return false;
    }
    const row = item as Record<string, unknown>;
    return typeof row.id === "string" && typeof row.title === "string" && typeof row.body === "string";
  });
}
