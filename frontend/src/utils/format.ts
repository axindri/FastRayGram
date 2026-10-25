export function fromMinorUnits(value: number, decimalPlaces = 2): number {
  const digits = Number.isFinite(decimalPlaces) && decimalPlaces >= 0 ? decimalPlaces : 2;
  return value / 10 ** digits;
}

/** Formats a major-unit amount (e.g. hosting balance already scaled by backend). */
export function formatMoney(value: number, currency: string, decimalPlaces = 2): string {
  const code = currency.trim().toUpperCase() || "EUR";
  const digits = Number.isFinite(decimalPlaces) && decimalPlaces >= 0 ? decimalPlaces : 2;

  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: code,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  } catch {
    return `${value.toLocaleString("ru-RU", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })} ${code}`;
  }
}

/** Formats a minor-unit amount (invoice/config cents: 150 → 1,50 €). */
export function formatMoneyMinor(value: number, currency: string, decimalPlaces = 2): string {
  return formatMoney(fromMinorUnits(value, decimalPlaces), currency, decimalPlaces);
}

export function formatTraffic(usedBytes: number, totalGb: number): string {
  const usedGb = (usedBytes / 1024 ** 3).toFixed(2);

  if (!totalGb) {
    return `${usedGb} GB / без лимита`;
  }

  return `${usedGb} / ${totalGb} GB`;
}

export function formatLimitIps(limitIps: number): string {
  if (!limitIps) {
    return "без лимита";
  }

  return String(limitIps);
}

export function displayName(username: string): string {
  const name = username.includes("@") ? username.split("@")[0] : username;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function avatarLetter(username: string): string {
  return displayName(username).charAt(0).toUpperCase();
}
