import { theme, type ThemeConfig } from "antd";

export type ThemeMode = "light" | "dark" | "system";

export type ResolvedTheme = "light" | "dark";

export type AccentId = "default" | "pink" | "blue" | "neon" | "mint" | "amber" | "emerald" | "indigo" | "rose" | "slate" | "violet" | "lime" | "cyan";

export const THEME_STORAGE_KEY = "theme";
export const ACCENT_STORAGE_KEY = "accent";

export const ACCENT_PRESETS: { id: AccentId; label: string; color: string }[] = [
  { id: "default", label: "Стандарт", color: "#1677ff" },
  { id: "pink", label: "Розовый", color: "#ec4899" },
  { id: "neon", label: "Неон", color: "#b829f6" },
  { id: "mint", label: "Бирюза", color: "#14b8a6" },
  { id: "amber", label: "Янтарь", color: "#f59e0b" },
  { id: "emerald", label: "Изумруд", color: "#10b981" },
  { id: "indigo", label: "Индиго", color: "#6366f1" },
  { id: "rose", label: "Роза", color: "#f43f5e" },
  { id: "slate", label: "Грифель", color: "#64748b" },
  { id: "violet", label: "Фиалка", color: "#8b5cf6" },
  { id: "lime", label: "Лайм", color: "#84cc16" },
  { id: "cyan", label: "Циан", color: "#06b6d4" }
];

const accentColorById = Object.fromEntries(ACCENT_PRESETS.map((preset) => [preset.id, preset.color])) as Record<AccentId, string>;

export function getAccentColor(id: AccentId): string {
  return accentColorById[id];
}

export function readStoredAccentId(): AccentId {
  const stored = localStorage.getItem(ACCENT_STORAGE_KEY);
  if (stored && stored in accentColorById) {
    return stored as AccentId;
  }
  return "default";
}

const sidebarTokens = {
  light: {
    siderBg: "#ffffff",
    menuBg: "#ffffff",
    itemColor: "rgba(0, 0, 0, 0.65)",
    itemHoverBg: "rgba(0, 0, 0, 0.04)",
    itemHoverColor: "rgba(0, 0, 0, 0.88)",
    itemSelectedBg: "rgba(0, 0, 0, 0.06)",
    itemSelectedColor: "rgba(0, 0, 0, 0.88)",
  },
  dark: {
    siderBg: "#141414",
    menuBg: "#141414",
    itemColor: "rgba(255, 255, 255, 0.65)",
    itemHoverBg: "rgba(255, 255, 255, 0.04)",
    itemHoverColor: "rgba(255, 255, 255, 0.85)",
    itemSelectedBg: "rgba(255, 255, 255, 0.08)",
    itemSelectedColor: "rgba(255, 255, 255, 0.85)",
  },
} as const;

export function getThemeConfig(resolved: ResolvedTheme, colorPrimary: string): ThemeConfig {
  const isDark = resolved === "dark";
  const sidebar = isDark ? sidebarTokens.dark : sidebarTokens.light;

  return {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary,
    },
    components: {
      Layout: {
        siderBg: sidebar.siderBg,
        lightSiderBg: sidebarTokens.light.siderBg,
        triggerBg: isDark ? "#1f1f1f" : "#fafafa",
        lightTriggerBg: "#fafafa",
      },
      Menu: {
        activeBarWidth: 0,
        itemBg: sidebar.menuBg,
        subMenuItemBg: sidebar.menuBg,
        itemColor: sidebar.itemColor,
        itemHoverBg: sidebar.itemHoverBg,
        itemHoverColor: sidebar.itemHoverColor,
        itemSelectedBg: sidebar.itemSelectedBg,
        itemSelectedColor: sidebar.itemSelectedColor,
        darkItemBg: sidebarTokens.dark.menuBg,
        darkSubMenuItemBg: sidebarTokens.dark.menuBg,
        darkItemColor: sidebarTokens.dark.itemColor,
        darkItemHoverBg: sidebarTokens.dark.itemHoverBg,
        darkItemHoverColor: sidebarTokens.dark.itemHoverColor,
        darkItemSelectedBg: sidebarTokens.dark.itemSelectedBg,
        darkItemSelectedColor: sidebarTokens.dark.itemSelectedColor,
      },
    },
  };
}

export function getSidebarBg(resolved: ResolvedTheme) {
  return resolved === "dark" ? sidebarTokens.dark.siderBg : sidebarTokens.light.siderBg;
}

export function readStoredThemeMode(): ThemeMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

export function resolveThemeMode(mode: ThemeMode, prefersDark: boolean): ResolvedTheme {
  if (mode === "system") {
    return prefersDark ? "dark" : "light";
  }
  return mode;
}
