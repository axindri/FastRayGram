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

export function parseJwtExp(token: string): Date | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return null;
    }

    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: unknown };
    if (typeof json.exp !== "number") {
      return null;
    }

    return new Date(json.exp * 1000);
  } catch {
    return null;
  }
}

export function isJwtToken(token: string): boolean {
  return token.split(".").length === 3;
}

export function formatJwtExpiryRemaining(token: string): string | null {
  const expiry = parseJwtExp(token);
  if (!expiry) {
    return null;
  }

  return formatRemainingFromDate(expiry, "истёк");
}

export function formatDateExpiryRemaining(value: string): string | null {
  const expiry = new Date(value);
  if (Number.isNaN(expiry.getTime())) {
    return null;
  }

  return formatRemainingFromDate(expiry, "истекла");
}

function formatRemainingFromDate(expiry: Date, expiredLabel: string): string | null {
  const diffMs = expiry.getTime() - Date.now();
  if (diffMs <= 0) {
    return expiredLabel;
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const hourMs = 60 * 60 * 1000;

  if (diffMs >= dayMs) {
    const days = Math.floor(diffMs / dayMs);
    return `ещё ${days} ${pluralRu(days, "день", "дня", "дней")}`;
  }

  const hours = Math.max(1, Math.ceil(diffMs / hourMs));
  return `ещё ${hours} ${pluralRu(hours, "час", "часа", "часов")}`;
}

export function jwtExpiryTagColor(token: string): "success" | "error" | "default" {
  const expiry = parseJwtExp(token);
  if (!expiry) {
    return "default";
  }

  return expiryTagColor(expiry);
}

export function dateExpiryTagColor(value: string): "success" | "error" | "default" {
  const expiry = new Date(value);
  if (Number.isNaN(expiry.getTime())) {
    return "default";
  }

  return expiryTagColor(expiry);
}

function expiryTagColor(expiry: Date): "success" | "error" {
  return expiry.getTime() > Date.now() ? "success" : "error";
}
