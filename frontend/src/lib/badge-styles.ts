export const BADGE_STYLES = {
  success: "border-green-600/25 bg-green-600/10 text-green-700 dark:text-green-400",
  warning: "border-amber-600/25 bg-amber-600/10 text-amber-800 dark:text-amber-400",
  error: "",
  muted: "border-border bg-muted text-muted-foreground",
} as const;

export type BadgeTone = keyof typeof BADGE_STYLES;
