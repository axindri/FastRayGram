import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { isTelegramWebAppAvailable, initializeTelegramWebApp, prepareTelegramLoginData } from '@/utils';
import { TELEGRAM_BOT_URL } from '@/config/settings';

export function useTelegram() {
  const { telegramLogin, user, isInitialized, isLoading, setIsTelegramInited } = useAppStore();
  const navigate = useNavigate();
  const hasAttemptedLogin = useRef(false);
  const loginError = useRef(false); // Track if login failed

  useEffect(() => {
    // Don't run if TELEGRAM_BOT_URL is not configured
    if (!TELEGRAM_BOT_URL) {
      console.log('[useTelegram] TELEGRAM_BOT_URL not configured, skipping');
      return;
    }

    console.log('[useTelegram] Effect triggered', {
      isInitialized,
      hasUser: Boolean(user),
      isLoading,
      hasAttempted: hasAttemptedLogin.current,
      loginError: loginError.current,
    });
    if (!isInitialized) {
      console.log('[useTelegram] Store not initialized yet, aborting');
      return;
    }

    if (user) {
      console.log('[useTelegram] User already present, reset flags');
      hasAttemptedLogin.current = false; // Reset when user is logged in
      loginError.current = false; // Reset error flag when logged in
      return;
    }

    // Prevent multiple login attempts, retry after error, or if already loading
    if (hasAttemptedLogin.current || loginError.current || isLoading) {
      console.log('[useTelegram] Skipping login attempt', {
        hasAttempted: hasAttemptedLogin.current,
        loginError: loginError.current,
        isLoading,
      });
      return;
    }

    if (isTelegramWebAppAvailable()) {
      console.log('[useTelegram] Telegram WebApp available, initializing');
      initializeTelegramWebApp();

      const telegramData = prepareTelegramLoginData();
      if (telegramData) {
        console.log('[useTelegram] Telegram WebApp detected, got Telegram user');
        // Mark as attempted BEFORE any state updates to prevent race condition
        hasAttemptedLogin.current = true;
        setIsTelegramInited(true);
        telegramLogin(telegramData)
          .then(() => {
            console.log('[useTelegram] Telegram login succeeded, navigating home');
            navigate('/');
          })
          .catch(error => {
            console.error('[useTelegram] Telegram login failed:', error);
            toast.error('Telegram login failed');
            setIsTelegramInited(false);
            loginError.current = true; // Mark as error, don't reset hasAttemptedLogin
          });
      } else {
        console.log('[useTelegram] Telegram WebApp data missing, skipping login');
      }
    } else {
      console.log('[useTelegram] Telegram WebApp not available');
    }
  }, [isInitialized, user, isLoading]); // Only use primitive values from store, not functions
}
