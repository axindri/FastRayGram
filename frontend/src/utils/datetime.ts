/** Backend stores and returns datetimes in UTC (naive ISO strings without offset). */
export const MOSCOW_TIMEZONE = "Europe/Moscow";

const HAS_TIMEZONE_SUFFIX = /(?:Z|[+-]\d{2}:\d{2})$/i;

const MOSCOW_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
  timeZone: MOSCOW_TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Parse backend UTC datetime string into a Date (instant in time). */
export function parseUtcDate(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const isoLike = normalized.includes("T") ? normalized : normalized.replace(" ", "T");
  const utcValue = HAS_TIMEZONE_SUFFIX.test(isoLike) ? isoLike : `${isoLike}Z`;
  const date = new Date(utcValue);

  return Number.isNaN(date.getTime()) ? null : date;
}

/** Format backend UTC datetime for display in Moscow time. */
export function formatDate(value?: string | null): string {
  const date = parseUtcDate(value);
  return date ? MOSCOW_DATE_TIME_FORMATTER.format(date) : "—";
}

function pluralRu(value: number, one: string, few: string, many: string): string {
  const abs = Math.abs(value);
  const mod10 = abs % 10;
  const mod100 = abs % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return few;
  }

  return many;
}

export function formatExpiryRemaining(value?: string | null): string | null {
  const expiry = parseUtcDate(value);
  if (!expiry) {
    return null;
  }

  const diffMs = expiry.getTime() - Date.now();
  if (diffMs <= 0) {
    return "(истекло)";
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const hourMs = 60 * 60 * 1000;

  if (diffMs >= dayMs) {
    const days = Math.floor(diffMs / dayMs);
    return `(осталось ${days} ${pluralRu(days, "день", "дня", "дней")})`;
  }

  const hours = Math.max(1, Math.ceil(diffMs / hourMs));
  return `(осталось ${hours} ${pluralRu(hours, "час", "часа", "часов")})`;
}

export function isUtcDatePast(value?: string | null): boolean {
  const date = parseUtcDate(value);
  return !date || date.getTime() <= Date.now();
}
