import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function CardTitleWithIcon({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span>{children}</span>
    </span>
  );
}
