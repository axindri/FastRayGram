import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function StackedList({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("divide-y rounded-lg border bg-card", className)}>{children}</div>;
}
