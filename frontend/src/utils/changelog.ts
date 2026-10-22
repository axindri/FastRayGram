export type ChangelogItem = {
  id: string;
  date: string;
  title: string;
  body: string;
};

export const CHANGELOG_URL = "/changelog.json";
export const CHANGELOG_LAST_READ_KEY = "changelogLastReadId";

export function getChangelogLastReadId(): string | null {
  try {
    return localStorage.getItem(CHANGELOG_LAST_READ_KEY);
  } catch {
    return null;
  }
}

export function setChangelogLastReadId(id: string): void {
  try {
    localStorage.setItem(CHANGELOG_LAST_READ_KEY, id);
  } catch {
    // Ignore quota / private mode errors.
  }
}

/** Changelog is newest-first. Unread = items before lastReadId. */
export function isChangelogItemUnread(items: ChangelogItem[], itemId: string, lastReadId: string | null): boolean {
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

export function countUnreadChangelog(items: ChangelogItem[], lastReadId: string | null): number {
  return items.filter((item) => isChangelogItemUnread(items, item.id, lastReadId)).length;
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
