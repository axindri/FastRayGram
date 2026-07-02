import { Monitor, Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useThemeMode } from "@/providers/theme-provider";

type ThemeMode = "light" | "dark" | "system";

const MODE_LABELS: Record<ThemeMode, string> = {
  light: "Светлая",
  dark: "Тёмная",
  system: "Системная",
};

const MODE_ICONS: Record<ThemeMode, ReactNode> = {
  light: <Sun />,
  dark: <Moon />,
  system: <Monitor />,
};

const MODES: ThemeMode[] = ["light", "dark", "system"];

export function ThemeModePicker() {
  const { mode, setMode } = useThemeMode();

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-2">
      {MODES.map((value) => (
        <Button
          key={value}
          type="button"
          variant={mode === value ? "default" : "outline"}
          className="w-full justify-center"
          onClick={() => setMode(value)}
        >
          {MODE_ICONS[value]}
          {MODE_LABELS[value]}
        </Button>
      ))}
    </div>
  );
}
