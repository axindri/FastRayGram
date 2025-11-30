import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/config/settings';
let inMemoryAccessToken: string | null = null;

const isBrowser = typeof window !== 'undefined';

function writeSession(key: string, value: string | null): void {
  if (!isBrowser) return;
  if (value) {
    window.sessionStorage.setItem(key, value);
  } else {
    window.sessionStorage.removeItem(key);
  }
}

function writeLocal(key: string, value: string | null): void {
  if (!isBrowser) return;
  if (value) {
    window.localStorage.setItem(key, value);
  } else {
    window.localStorage.removeItem(key);
  }
}

function readSession(key: string): string | null {
  if (!isBrowser) return null;
  return window.sessionStorage.getItem(key);
}

function readLocal(key: string): string | null {
  if (!isBrowser) return null;
  return window.localStorage.getItem(key);
}

export const tokenStorage = {
  getAccessToken(): string | null {
    if (inMemoryAccessToken) return inMemoryAccessToken;
    const token = readSession(ACCESS_TOKEN_KEY);
    console.log('[tokenStorage] Loaded access token from sessionStorage:', Boolean(token));
    inMemoryAccessToken = token;
    return token;
  },
  setAccessToken(token: string | null): void {
    console.log('[tokenStorage] Saving access token to sessionStorage:', Boolean(token));
    inMemoryAccessToken = token;
    writeSession(ACCESS_TOKEN_KEY, token);
  },
  getRefreshToken(): string | null {
    const token = readLocal(REFRESH_TOKEN_KEY);
    console.log('[tokenStorage] Loaded refresh token from localStorage:', Boolean(token));
    return token;
  },
  setRefreshToken(token: string | null): void {
    console.log('[tokenStorage] Saving refresh token to localStorage:', Boolean(token));
    writeLocal(REFRESH_TOKEN_KEY, token);
  },
  clear(): void {
    this.setAccessToken(null);
    this.setRefreshToken(null);
  },
};
