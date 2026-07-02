import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { type ThemeMode, isThemeMode } from "@/lib/theme-options";

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_STORAGE_KEY = "theme";

function readStoredThemeMode(): ThemeMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored && isThemeMode(stored)) {
    return stored;
  }
  return "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => readStoredThemeMode());

  const setMode = (next: ThemeMode) => {
    localStorage.setItem(THEME_STORAGE_KEY, next);
    setModeState(next);
  };

  useEffect(() => {
    const resolved =
      mode === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : mode;
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.style.colorScheme = resolved;
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
      </NextThemesProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within ThemeProvider");
  }
  return context;
}
