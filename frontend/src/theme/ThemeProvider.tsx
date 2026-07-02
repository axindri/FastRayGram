import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ConfigProvider } from "antd";
import ruRU from "antd/locale/ru_RU";

import {
  ACCENT_PRESETS,
  getAccentColor,
  getThemeConfig,
  readStoredAccentId,
  readStoredThemeMode,
  resolveThemeMode,
  ACCENT_STORAGE_KEY,
  THEME_STORAGE_KEY,
  type AccentId,
  type ResolvedTheme,
  type ThemeMode,
} from "./config";

type ThemeContextValue = {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  accentId: AccentId;
  accentColor: string;
  accentPresets: typeof ACCENT_PRESETS;
  setMode: (mode: ThemeMode) => void;
  setAccentId: (id: AccentId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readSystemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => readStoredThemeMode());
  const [accentId, setAccentIdState] = useState<AccentId>(() => readStoredAccentId());
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => readSystemPrefersDark());

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setSystemPrefersDark(media.matches);

    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const resolved = useMemo(() => resolveThemeMode(mode, systemPrefersDark), [mode, systemPrefersDark]);
  const accentColor = useMemo(() => getAccentColor(accentId), [accentId]);
  const themeConfig = useMemo(() => getThemeConfig(resolved, accentColor), [resolved, accentColor]);

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
  }, [resolved]);

  const setMode = useCallback((next: ThemeMode) => {
    localStorage.setItem(THEME_STORAGE_KEY, next);
    setModeState(next);
  }, []);

  const setAccentId = useCallback((next: AccentId) => {
    localStorage.setItem(ACCENT_STORAGE_KEY, next);
    setAccentIdState(next);
  }, []);

  const value = useMemo(
    () => ({
      mode,
      resolved,
      accentId,
      accentColor,
      accentPresets: ACCENT_PRESETS,
      setMode,
      setAccentId,
    }),
    [mode, resolved, accentId, accentColor, setMode, setAccentId],
  );

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider locale={ruRU} theme={themeConfig}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
