import { Button } from "@/components/ui/button";
import { THEME_MODE_ICONS, THEME_MODE_LABELS, THEME_MODES, type ThemeMode } from "@/lib/theme-options";
import { useThemeMode } from "@/providers/theme-provider";

export function ThemeModePicker() {
  const { mode, setMode } = useThemeMode();

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-2">
      {THEME_MODES.map((value) => {
        const Icon = THEME_MODE_ICONS[value];
        return (
          <Button
            key={value}
            type="button"
            variant={mode === value ? "default" : "outline"}
            className="w-full justify-center"
            onClick={() => setMode(value as ThemeMode)}
          >
            <Icon />
            {THEME_MODE_LABELS[value]}
          </Button>
        );
      })}
    </div>
  );
}
