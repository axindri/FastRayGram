import type { TelegramLoginRequest } from '@/services/api/types';

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username: string;
            language_code: string;
          };
        };
        ready: () => void;
        expand: () => void;
      };
    };
  }
}

/**
 * Checks if Telegram WebApp is available
 */
export function isTelegramWebAppAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
}

/**
 * Gets Telegram WebApp instance
 */
export function getTelegramWebApp() {
  return window.Telegram?.WebApp;
}

/**
 * Initializes Telegram WebApp (ready and expand)
 */
export function initializeTelegramWebApp(): void {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.ready();
    tg.expand();
  }
}

/**
 * Gets Telegram user data from WebApp
 * @returns Telegram user data or null if not available
 */
export function getTelegramUserData(): {
  userData: {
    id: number;
    first_name: string;
    last_name?: string;
    username: string;
    language_code: string;
  };
  initDataStr: string;
} | null {
  const tg = getTelegramWebApp();
  if (!tg || !tg.initDataUnsafe.user) {
    return null;
  }

  return {
    userData: tg.initDataUnsafe.user,
    initDataStr: tg.initData,
  };
}

/**
 * Prepares Telegram login request data
 * @returns Telegram login request data or null if not available
 */
export function prepareTelegramLoginData(): TelegramLoginRequest | null {
  const telegramData = getTelegramUserData();
  if (!telegramData) {
    return null;
  }

  return {
    id: telegramData.userData.id,
    first_name: telegramData.userData.first_name,
    last_name: telegramData.userData.last_name,
    username: telegramData.userData.username,
    language_code: telegramData.userData.language_code,
    init_data_str: telegramData.initDataStr,
  };
}
