import { Palette } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { THEME_MODE_ICONS, THEME_MODE_LABELS, THEME_MODES, isThemeMode } from "@/lib/theme-options";
import { useThemeMode } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";

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
        <DropdownMenuRadioGroup value={mode} onValueChange={(value) => isThemeMode(value) && setMode(value)}>
          {THEME_MODES.map((value) => {
            const Icon = THEME_MODE_ICONS[value];
            return (
              <DropdownMenuRadioItem key={value} value={value}>
                <span className="flex items-center gap-2">
                  <Icon />
                  {THEME_MODE_LABELS[value]}
                </span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
