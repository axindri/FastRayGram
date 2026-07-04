import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";

export type NavSection = "main" | "admin" | "settings";

// App
export const APP_VERSION = "v3.2.0";
export const TOKEN_KEY = "authToken";
export const API_PREFIX = "/api";
export const THEME_STORAGE_KEY = "theme";

// Timing & limits
export const STATUS_POLL_MS = 60_000;
export const RENEWAL_WINDOW_MS = 24 * 60 * 60 * 1000;
export const INVOICES_PAGE_LIMIT = 3;

// Validation
export const MARK_MAX_LENGTH = 64;
export const MARK_HINT = `До ${MARK_MAX_LENGTH} символов`;

export const USERNAME_MAX_LENGTH = 32;
export const USERNAME_PATTERN = /^[a-zA-Z0-9]+$/;
export const USERNAME_HINT = "Только латинские буквы и цифры, до 32 символов";

// Theme
export type ThemeMode = "light" | "dark" | "system";

export const THEME_MODES: ThemeMode[] = ["light", "dark", "system"];

export const THEME_MODE_LABELS: Record<ThemeMode, string> = {
  light: "Светлая",
  dark: "Тёмная",
  system: "Системная",
};

export const THEME_MODE_ICONS: Record<ThemeMode, LucideIcon> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

// Roles & statuses
export type UserRole = "user" | "admin" | "superuser";

export const ROLE_LABELS: Record<UserRole, string> = {
  user: "Пользователь",
  admin: "Администратор",
  superuser: "Суперпользователь",
};

export const STATUS_META_KEYS = new Set(["avilable_statuses", "available_statuses"]);

export const SERVICE_STATUS_LABELS: Record<string, string> = {
  ok: "OK",
  error: "Ошибка",
  warning: "Предупреждение",
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает оплаты",
  processing: "В обработке",
  paid: "Оплачено",
  cancelled: "Отменён",
};

// Navigation
export const NAV_SECTION_LABELS: Record<NavSection, string> = {
  main: "Основное",
  admin: "Администрирование",
  settings: "Настройки",
};

// Admin panels
export const ADMIN_LINKS_META = [
  { key: "swagger_url" as const, title: "Swagger", hint: "Документация API" },
  { key: "services_status_url" as const, title: "Services Status", hint: "Статус сервисов в Uptime Kuma" },
  { key: "xui_panel_url" as const, title: "XUI Panel", hint: "Панель управления" },
  { key: "servers_url" as const, title: "TimeWeb Servers", hint: "Серверы в панели TimeWeb" },
];

// Users / XUI
export const FLOW_NONE = "__none__";

export const FLOW_OPTIONS = [
  { value: FLOW_NONE, label: "Пусто" },
  { value: "xtls-rprx-vision", label: "xtls-rprx-vision" },
] as const;

export const LIMIT_IP_HINT =
  "Лимит IP — это не число устройств. С одного IP могут подключаться несколько устройств. Ограничение действует на количество разных IP-адресов одновременно.";

// Payments
export type PaymentSearchField = "invoiceId" | "id" | "username";

export const PAYMENT_SEARCH_FIELD_LABELS: Record<PaymentSearchField, string> = {
  invoiceId: "Номер платежа",
  id: "ID платежа",
  username: "Имя пользователя",
};

// UI copy
export const RENEW_HINT =
  "Новый счёт можно выставить, когда до конца подписки останется меньше 24 часов (включая уже истёкшую).";

export const CONTACT_MESSAGE =
  "По всем вопросам обращайтесь к администратору или в личные сообщения группы.";

// Profile result pages
export type ProfileResultStatus = "success" | "error" | "403" | "404" | "500" | "info" | "warning";

export const PROFILE_RESULT_STATUS_CARD_CLASS: Record<ProfileResultStatus, string> = {
  success: "border-green-500/40 bg-green-50/80 dark:border-green-500/30 dark:bg-green-950/30",
  error: "border-destructive/40 bg-destructive/5 dark:border-destructive/30 dark:bg-destructive/10",
  "403": "border-destructive/40 bg-destructive/5 dark:border-destructive/30 dark:bg-destructive/10",
  "404": "border-destructive/40 bg-destructive/5 dark:border-destructive/30 dark:bg-destructive/10",
  "500": "border-destructive/40 bg-destructive/5 dark:border-destructive/30 dark:bg-destructive/10",
  info: "",
  warning: "border-amber-500/40 bg-amber-50/80 dark:border-amber-500/30 dark:bg-amber-950/30",
};
