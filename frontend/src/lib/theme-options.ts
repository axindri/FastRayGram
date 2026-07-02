import { THEME_MODES, type ThemeMode } from "@/constants";

export {
  THEME_MODE_ICONS,
  THEME_MODE_LABELS,
  THEME_MODES,
  type ThemeMode,
} from "@/constants";

export function isThemeMode(value: string): value is ThemeMode {
  return THEME_MODES.includes(value as ThemeMode);
}
