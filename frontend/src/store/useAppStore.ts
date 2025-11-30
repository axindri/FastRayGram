import { create } from 'zustand';
import type { AppState, User } from './types';
import { apiClient } from '@/services';
import { tokenStorage } from '@/services/api/tokenStorage';
import i18n from '@/i18n/config';

interface AppStore extends AppState {
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: 'en' | 'ru') => void;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  login: (login: string, password: string) => Promise<void>;
  telegramLogin: (telegramData: { id: number; first_name: string; last_name?: string; username: string; language_code: string; init_data_str: string }) => Promise<void>;
  setIsTelegramInited: (isTelegramInited: boolean) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  reset: () => void;
}

function getInitialTheme(): 'light' | 'dark' | 'system' {
  if (typeof window === 'undefined') return 'system';

  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;

  if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
    return savedTheme;
  }

  return 'system';
}

// Helper function to normalize lang_code to 'en' | 'ru'
function normalizeLanguage(langCode: string | undefined | null): 'en' | 'ru' {
  if (!langCode) return 'en';
  const normalized = langCode.toLowerCase().trim();
  if (normalized.startsWith('ru')) return 'ru';
  return 'en';
}

// Helper function to load user profile and set language
async function loadUserProfileAndSetLanguage(set: (state: Partial<AppState>) => void) {
  try {
    const profile = await apiClient.getProfile();
    const language = normalizeLanguage(profile.profile.lang_code);
    set({ language });
    i18n.changeLanguage(language);
  } catch (error) {
    // If profile loading fails, keep current language
    console.warn('Failed to load profile for language setting:', error);
  }
}

const initialState: AppState = {
  theme: getInitialTheme(),
  language: 'en',
  user: null,
  isLoading: false,
  isInitialized: false,
  isTelegramInited: false,
};

export const useAppStore = create<AppStore>(set => ({
  ...initialState,

  setTheme: theme => {
    set({ theme });
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  },

  setLanguage: language => {
    set({ language });
    i18n.changeLanguage(language);
  },

  setUser: user => set({ user }),

  setLoading: isLoading => set({ isLoading }),

  login: async (login: string, password: string) => {
    set({ isLoading: true });
    try {
      console.log('[useAppStore] Starting login flow');
      await apiClient.login({ login, password });
      const user = await apiClient.getCurrentUser();
      set({ user, isLoading: false });
      console.log('[useAppStore] Login successful, user loaded');
      // Load profile and set language
      await loadUserProfileAndSetLanguage(set);
    } catch (error) {
      console.error('[useAppStore] Login failed', error);
      set({ isLoading: false });
      throw error;
    }
  },

  setIsTelegramInited: (isTelegramInited: boolean) => set({ isTelegramInited }),

  telegramLogin: async telegramData => {
    const currentState = useAppStore.getState();
    // Prevent parallel calls
    if (currentState.isLoading) {
      console.log('[useAppStore] Login already in progress, skipping...');
      return;
    }

    tokenStorage.clear();
    set({ isLoading: true });
    try {
      console.log('[useAppStore] Starting telegram login');
      await apiClient.telegramLogin(telegramData);
      const user = await apiClient.getCurrentUser();
      set({ user, isLoading: false });
      console.log('[useAppStore] Telegram login successful');
      // Load profile and set language
      await loadUserProfileAndSetLanguage(set);
    } catch (error) {
      console.error('[useAppStore] Telegram login failed', error);
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      console.log('[useAppStore] Logging out');
      await apiClient.logout();
      set({ user: null, isLoading: false, language: 'en' });
      i18n.changeLanguage('en');
      console.log('[useAppStore] Logout successful');
    } catch (error) {
      console.error('[useAppStore] Logout failed', error);
      set({ isLoading: false });
      throw error;
    } finally {
      tokenStorage.clear();
    }
  },

  checkAuth: async () => {
    const currentState = useAppStore.getState();
    if (currentState.isInitialized || currentState.isLoading) {
      console.log('[useAppStore] Already initialized or loading');
      return;
    }
    set({ isLoading: true });
    console.log('[useAppStore] Checking user auth status, searching for access token');
    const token = tokenStorage.getAccessToken();
    if (!token) {
      console.log('[useAppStore] No access token found, searching for refresh token');
      const refresh = tokenStorage.getRefreshToken();
      if (!refresh) {
        console.log('[useAppStore] No refresh token found');
        set({ user: null, isLoading: false, isInitialized: true });
        return;
      }
      try {
        console.log('[useAppStore] Attempting to refresh token during checkAuth');
        await apiClient.refreshToken();
        console.log('[useAppStore] Refresh successful during checkAuth');
      } catch (error) {
        console.warn('[useAppStore] Failed to refresh token during checkAuth:', error);
        tokenStorage.clear();
        set({ user: null, isLoading: false, isInitialized: true });
        return;
      }
    }
    try {
      const user = await apiClient.getCurrentUser();
      set({ user, isLoading: false, isInitialized: true });
      console.log('[useAppStore] User fetched successfully during checkAuth');
      // Load profile and set language
      await loadUserProfileAndSetLanguage(set);
    } catch (error) {
      console.error('[useAppStore] Failed to fetch user during checkAuth', error);
      set({ user: null, isLoading: false, isInitialized: true });
      tokenStorage.clear();
    }
  },

  reset: () => set(initialState),
}));
