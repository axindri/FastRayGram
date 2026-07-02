import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";

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

export function isThemeMode(value: string): value is ThemeMode {
  return THEME_MODES.includes(value as ThemeMode);
}
