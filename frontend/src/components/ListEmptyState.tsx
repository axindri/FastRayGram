import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

type ListEmptyStateProps = {
  description?: string;
  title?: string;
  icon?: LucideIcon;
  children?: ReactNode;
  className?: string;
  minHeight?: number;
};

export function ListEmptyState({
  description,
  title,
  icon: Icon = Inbox,
  children,
  className,
  minHeight,
}: ListEmptyStateProps) {
  return (
    <Empty className={cn("w-full", className)} style={minHeight ? { minHeight } : undefined}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        {title ? <EmptyTitle>{title}</EmptyTitle> : null}
        {description ? <EmptyDescription>{description}</EmptyDescription> : null}
      </EmptyHeader>
      {children ? <EmptyContent>{children}</EmptyContent> : null}
    </Empty>
  );
}
