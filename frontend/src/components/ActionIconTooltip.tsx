import type { ReactElement } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type ActionIconTooltipProps = {
  label: string;
  children: ReactElement;
};

export function ActionIconTooltip({ label, children }: ActionIconTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}
