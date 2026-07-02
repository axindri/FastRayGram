import {
  Key,
  Monitor,
  Settings,
  User,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { UserRole } from "@/types";
import type { NavSection } from "@/constants";
import { NAV_SECTION_LABELS } from "@/constants";

export type { NavSection } from "@/constants";
export { NAV_SECTION_LABELS };

export type NavChildItem = {
  path: string;
  label: string;
};

export type NavItem = {
  path: string;
  label: string;
  hint: string;
  Icon: LucideIcon;
  section: NavSection;
  adminOnly?: boolean;
  children?: NavChildItem[];
};

export const NAV_ITEMS: NavItem[] = [
  { path: "/profile", label: "Профиль", hint: "Подписка, счета и вход", Icon: User, section: "main" },
  { path: "/monitoring", label: "Мониторинг", hint: "Статус сервисов и внешние панели", Icon: Monitor, section: "admin", adminOnly: true },
  {
    path: "/payments",
    label: "Платежи",
    hint: "Поиск и управление счетами",
    Icon: Wallet,
    section: "admin",
    adminOnly: true,
    children: [
      { path: "/payments/all", label: "Все счета" },
      { path: "/payments/paid", label: "Оплаченные счета" },
    ],
  },
  {
    path: "/users",
    label: "Пользователи",
    hint: "Аккаунты и XUI-клиенты",
    Icon: Users,
    section: "admin",
    adminOnly: true,
    children: [
      { path: "/users/create", label: "Создать пользователя" },
      { path: "/users/all", label: "Все пользователи" },
      { path: "/users/xui", label: "XUI клиент" },
    ],
  },
  { path: "/registration", label: "Регистрация", hint: "Коды для новых пользователей", Icon: Key, section: "admin", adminOnly: true },
  {
    path: "/settings",
    label: "Настройки",
    hint: "Оформление и параметры интерфейса",
    Icon: Settings,
    section: "settings",
    children: [{ path: "/settings/appearance", label: "Оформление" }],
  },
];

export function filterNavItems(role: UserRole, options?: { excludePaths?: string[] }): NavItem[] {
  const exclude = new Set(options?.excludePaths ?? []);

  return NAV_ITEMS.filter((item) => !exclude.has(item.path) && (!item.adminOnly || role === "admin" || role === "superuser"));
}

export function getNavItemByPath(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => {
    if (item.children?.some((child) => pathname.startsWith(child.path))) {
      return true;
    }

    return pathname.startsWith(item.path);
  });
}

export function getNavChildByPath(pathname: string): NavChildItem | undefined {
  for (const item of NAV_ITEMS) {
    const child = item.children?.find((entry) => pathname.startsWith(entry.path));
    if (child) {
      return child;
    }
  }

  return undefined;
}

export function groupNavItems(items: NavItem[]): { section: NavSection; items: NavItem[] }[] {
  const order: NavSection[] = ["main", "admin", "settings"];

  return order
    .map((section) => ({
      section,
      items: items.filter((item) => item.section === section),
    }))
    .filter((group) => group.items.length > 0);
}

export type FlatNavLink = {
  path: string;
  label: string;
  hint: string;
  Icon: LucideIcon;
  parentLabel?: string;
};

export function flattenNavLinks(items: NavItem[]): FlatNavLink[] {
  return items.flatMap((item) => {
    if (!item.children?.length) {
      return [{ path: item.path, label: item.label, hint: item.hint, Icon: item.Icon }];
    }

    return item.children.map((child) => ({
      path: child.path,
      label: child.label,
      hint: item.hint,
      Icon: item.Icon,
      parentLabel: item.label,
    }));
  });
}
