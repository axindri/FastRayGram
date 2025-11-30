import { UserIcon, RequestIcon, ConfigsIcon, SystemThemeIcon, LightThemeIcon, DarkThemeIcon, type MenuItem } from '@/components';

// Environment variables
export const API_URL = import.meta.env.VITE_API_URL;
export const TELEGRAM_GROUP_URL = import.meta.env.VITE_TELEGRAM_GROUP_URL;
export const TELEGRAM_BOT_URL = import.meta.env.VITE_TELEGRAM_BOT_URL;
export const GITHUB_URL = 'https://github.com/axindri/FastRayGram';
export const DONATION_URL = 'https://boosty.to/axindri/donate';

// Constants
export const APP_VERSION = '0.9';

export const LANGUAGES = {
  EN: 'en',
  RU: 'ru',
};

export const ROLES = {
  SUPERUSER: 'superuser',
  ADMIN: 'admin',
  USER: 'user',
};

export const CONFIG_TYPES = {
  VLESS: 'vless',
  // TROJAN: 'trojan',
};
export const CONTRIBUTORS = [{ name: 'Alex', github: 'https://github.com/axindri', role: 'Maintainer' }];

export const PAGINATION_LIMIT = 10;

export const getAdminMenuItems = (t: (key: string) => string): MenuItem[] => [
  {
    id: 'requests',
    label: t('layout.appLayout.requests'),
    icon: <RequestIcon />,
  },
  {
    id: 'users',
    label: t('layout.appLayout.users'),
    icon: <UserIcon />,
  },
  {
    id: 'configs',
    label: t('layout.appLayout.configs'),
    icon: <ConfigsIcon />,
  },
];

export type AdminView = 'menu' | 'requests' | 'users' | 'configs' | 'user' | 'config';

// App settings constants
export const getThemes = (): { label: string; icon: React.ReactNode }[] => {
  return [
    {
      label: 'system',
      icon: <SystemThemeIcon />,
    },
    {
      label: 'light',
      icon: <LightThemeIcon />,
    },
    {
      label: 'dark',
      icon: <DarkThemeIcon />,
    },
  ];
};

export const getLanguages = (): { label: string; icon: React.ReactNode }[] => [
  {
    label: 'en',
    icon: null,
  },
  {
    label: 'ru',
    icon: null,
  },
];

// Config default limits
export const DEFAULT_CONFIG_LIMITS = {
  max_limit_ip: 1,
  max_total_gb: 100,
};

// Admin time operations
export const ADMIN_TIME_OPERATIONS = {
  DEFAULT_DAYS: 30,
  DEFAULT_HOURS: 0,
};

export const DEBUG_MENU_COUNTER = 5;

// Auth/token settings
export const ACCESS_TOKEN_KEY = 'frg_access_token';
export const REFRESH_TOKEN_KEY = 'frg_refresh_token';
export const ACCESS_TOKEN_REFRESH_THRESHOLD_SEC = 60; // bigger than KEEPALIVE_INTERVAL_SEC and less (not equal) than refresh token expire time at backend
export const KEEPALIVE_INTERVAL_SEC = 10;
