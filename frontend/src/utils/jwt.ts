function decodeBase64Url(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const globalAtob = typeof atob === 'function' ? atob : undefined;
  if (globalAtob) {
    return globalAtob(padded);
  }
  return '';
}

export function getTokenExpiration(token: string): number | null {
  try {
    const [, payloadEncoded] = token.split('.');
    if (!payloadEncoded) return null;
    const json = decodeBase64Url(payloadEncoded);
    const payload = JSON.parse(json) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

export function isTokenExpiringSoon(token: string, thresholdSeconds: number): boolean {
  const exp = getTokenExpiration(token);
  if (!exp) return false;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  console.log(`[jwt] Token expiry in ${exp - nowInSeconds} seconds, threshold to refresh is ${thresholdSeconds} seconds`);
  const isExpiringSoon = exp - nowInSeconds <= thresholdSeconds;
  return isExpiringSoon;
}
