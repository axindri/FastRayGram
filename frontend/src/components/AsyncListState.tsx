import { Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { ListEmptyState } from "@/components/ListEmptyState";

type AsyncListStateProps = {
  loading: boolean;
  empty: boolean;
  emptyDescription: string;
  emptyTitle?: string;
  emptyIcon?: LucideIcon;
  children: ReactNode;
  minHeight?: number;
  size?: "default" | "large";
  gap?: "default" | "none";
};

export function AsyncListState({
  loading,
  empty,
  emptyDescription,
  emptyTitle,
  emptyIcon,
  children,
  minHeight = 120,
  size = "large",
  gap = "default",
}: AsyncListStateProps) {
  if (loading && empty) {
    return (
      <div
        className={cn("flex items-center justify-center", size === "large" ? "py-6" : undefined)}
        style={{ minHeight }}
      >
        <Loader2 className={cn("animate-spin text-muted-foreground", size === "large" ? "size-8" : "size-6")} />
      </div>
    );
  }

  if (!loading && empty) {
    return (
      <ListEmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon={emptyIcon}
        minHeight={minHeight}
      />
    );
  }

  return <div className={cn("flex w-full flex-col", gap === "default" && "gap-4")}>{children}</div>;
}
