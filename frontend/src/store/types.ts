export interface User {
  id: string;
  login: string;
  role: string;
}

export interface AppState {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'ru';
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  isTelegramInited: boolean;
}
