import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ThemedIconAvatarProps = {
  icon: ReactNode;
  className?: string;
  size?: "sm" | "default";
};

export function ThemedIconAvatar({ icon, className, size = "default" }: ThemedIconAvatarProps) {
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground [&_svg:not([class*='size-'])]:size-4",
        size === "sm" ? "size-7 [&_svg:not([class*='size-'])]:size-3.5" : "size-8",
        className,
      )}
    >
      {icon}
    </div>
  );
}
