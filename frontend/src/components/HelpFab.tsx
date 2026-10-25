import { CircleHelp } from "lucide-react";

import { useAppConfig } from "@/hooks/useAppConfig";
import { cn } from "@/lib/utils";

export function HelpFab() {
  const { config } = useAppConfig();
  const helpUrl = String(config?.help_url || "").trim();

  if (!helpUrl) {
    return null;
  }

  return (
    <a
      href={helpUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Помощь"
      className={cn(
        "fixed z-50 inline-flex items-center gap-2 rounded-full border bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg transition hover:opacity-90",
        "bottom-4 left-1/2 -translate-x-1/2",
        "md:bottom-6 md:left-auto md:right-6 md:translate-x-0",
      )}
    >
      <CircleHelp className="size-4" />
      Помощь
    </a>
  );
}
