import { KeyOutlined, DollarOutlined, MonitorOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";
import type { ComponentType } from "react";

import type { UserRole } from "../types";

type NavIcon = ComponentType;

export type NavItem = {
  path: string;
  label: string;
  hint: string;
  Icon: NavIcon;
  adminOnly?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { path: "/profile", label: "Профиль", hint: "Подписка и платежи", Icon: UserOutlined },
  { path: "/monitoring", label: "Мониторинг", hint: "Статус сервисов и ссылки на панели", Icon: MonitorOutlined, adminOnly: true },
  { path: "/payments", label: "Платежи", hint: "Проверка и управление счетами к оплате", Icon: DollarOutlined, adminOnly: true },
  { path: "/users", label: "Пользователи", hint: "Создание пользователей и XUI-клиентов", Icon: TeamOutlined, adminOnly: true },
  { path: "/registration", label: "Регистрация", hint: "Коды и ссылки для регистрации новых пользователей", Icon: KeyOutlined, adminOnly: true },
];

export function filterNavItems(role: UserRole, options?: { excludePaths?: string[] }): NavItem[] {
  const exclude = new Set(options?.excludePaths ?? []);

  return NAV_ITEMS.filter((item) => !exclude.has(item.path) && (!item.adminOnly || role === "admin" || role === "superuser"));
}
