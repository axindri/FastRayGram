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
