import { HelpCircle } from "lucide-react";
import type { ReactNode } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type HintTooltipProps = {
  title: ReactNode;
};

export function HintTooltip({ title }: HintTooltipProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex text-muted-foreground hover:text-foreground"
          aria-label="Подсказка"
        >
          <HelpCircle className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-auto max-w-xs">
        {title}
      </PopoverContent>
    </Popover>
  );
}
