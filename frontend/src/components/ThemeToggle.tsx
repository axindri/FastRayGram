import { Monitor, Moon, Palette, Sun } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useThemeMode } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";

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

export function ThemeToggle({ block = false }: { block?: boolean }) {
  const { mode, setMode } = useThemeMode();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" className={cn(block && "w-full")} aria-label="Оформление">
          <Palette />
          Оформление
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="min-w-[220px]">
        <DropdownMenuLabel>Тема</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={mode} onValueChange={(value) => setMode(value as ThemeMode)}>
          {(Object.keys(MODE_LABELS) as ThemeMode[]).map((value) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <span className="flex items-center gap-2">
                {MODE_ICONS[value]}
                {MODE_LABELS[value]}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
