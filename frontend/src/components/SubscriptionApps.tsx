import { HelpCircle, LayoutGrid, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  appSearchUrl,
  buildSubscriptionApps,
  detectAppPlatform,
  type AppPlatform,
  type SubscriptionApp,
} from "@/utils/subscriptionApps";

type SubscriptionAppsProps = {
  subUrl: string;
  name?: string;
  className?: string;
};

const PLATFORM_LABELS: Record<AppPlatform, string> = {
  all: "Все",
  android: "Android",
  ios: "iOS",
  macos: "macOS",
  windows: "Windows",
  linux: "Linux",
};

function PlatformIcon({ platform }: { platform: AppPlatform }) {
  const className = "size-3.5 shrink-0";

  if (platform === "all") {
    return <LayoutGrid className={className} aria-hidden />;
  }

  if (platform === "android") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
        <path d="M17.6 9.48l1.84-3.18a.5.5 0 0 0-.86-.5l-1.87 3.24A8.9 8.9 0 0 0 12 8c-1.64 0-3.16.44-4.71 1.04L5.42 5.8a.5.5 0 1 0-.86.5l1.84 3.18C4.2 10.9 3 13.06 3 15.5v.5c0 .55.45 1 1 1h1v2.5a1.5 1.5 0 0 0 3 0V17h8v2.5a1.5 1.5 0 0 0 3 0V17h1c.55 0 1-.45 1-1v-.5c0-2.44-1.2-4.6-3.4-6.02zM8.5 14a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm7 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
      </svg>
    );
  }

  if (platform === "ios" || platform === "macos") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
        <path d="M18.71 12.64c-.03-2.86 2.34-4.24 2.45-4.31-1.33-1.95-3.41-2.21-4.15-2.24-1.77-.18-3.45 1.04-4.35 1.04-.9 0-2.28-1.02-3.76-.99-1.93.03-3.71 1.13-4.7 2.86-2.02 3.5-.52 8.68 1.45 11.52.96 1.39 2.1 2.95 3.6 2.89 1.45-.06 2-.93 3.75-.93s2.25.93 3.77.9c1.56-.03 2.55-1.41 3.5-2.81 1.11-1.61 1.57-3.17 1.59-3.25-.03-.02-3.05-1.17-3.15-4.68zM15.4 4.5c.8-.97 1.34-2.31 1.19-3.65-1.15.05-2.55.77-3.38 1.73-.74.85-1.39 2.22-1.22 3.53 1.29.1 2.61-.66 3.41-1.61z" />
      </svg>
    );
  }

  if (platform === "windows") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
        <path d="M3 5.5 10.5 4.4v7.1H3V5.5zm0 13 7.5 1.1v-7.2H3v6.1zM11.5 4.25 21 3v8.5h-9.5V4.25zm0 16.5L21 21v-8.6h-9.5v8.35z" />
      </svg>
    );
  }

  // Classic Tux penguin silhouette
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 1.8c-2.4 0-4.3 2.1-4.3 4.8 0 1.5.6 2.8 1.6 3.6-.8.4-1.5 1.1-1.9 2-.6 1.4-.5 3 0 4.4.4 1.1 1.1 2 2 2.6v1.4c0 1 .8 1.8 1.8 1.8h.4v1.1c0 .7.5 1.2 1.2 1.2h.4c.7 0 1.2-.5 1.2-1.2V20h.4c1 0 1.8-.8 1.8-1.8v-1.4c.9-.6 1.6-1.5 2-2.6.5-1.4.6-3 0-4.4-.4-.9-1.1-1.6-1.9-2 1-.8 1.6-2.1 1.6-3.6 0-2.7-1.9-4.8-4.3-4.8zm-1.7 4.2a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm3.4 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
      <path d="M8.8 14.6c.4 0 .8.2 1 .6.4.8 1.1 1.3 2.2 1.3s1.8-.5 2.2-1.3c.2-.4.6-.6 1-.6.5 0 .9.3 1 .7.1.3 0 .6-.2.8-.7 1.3-2.2 2.1-4 2.1s-3.3-.8-4-2.1c-.2-.2-.3-.5-.2-.8.1-.4.5-.7 1-.7z" />
      <path d="M6.6 13.5c-.9.3-1.6 1-1.9 1.9-.2.5.1 1.1.6 1.3.5.2 1.1-.1 1.3-.6.2-.4.5-.7.9-.8.4-.1.7-.5.6-1-.1-.4-.5-.8-1-.8-.2 0-.3 0-.5 0zm10.8 0c-.2 0-.3 0-.5 0-.5 0-.9.4-1 .8-.1.5.2.9.6 1 .4.1.7.4.9.8.2.5.8.8 1.3.6.5-.2.8-.8.6-1.3-.3-.9-1-1.6-1.9-1.9z" />
      <ellipse cx="12" cy="11.2" rx="1.1" ry=".7" />
    </svg>
  );
}

function AppIcon({ app }: { app: SubscriptionApp }) {
  if (!app.icon) {
    return (
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tracking-tight text-white"
        style={{ backgroundColor: app.color }}
        aria-hidden
      >
        {app.name.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  if (app.tinted) {
    return (
      <span
        className="size-9 shrink-0"
        style={{
          backgroundColor: app.color,
          maskImage: `url("${app.icon}")`,
          WebkitMaskImage: `url("${app.icon}")`,
          maskSize: "contain",
          WebkitMaskSize: "contain",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
        }}
        role="img"
        aria-label={app.name}
      />
    );
  }

  return <img src={app.icon} alt="" className="size-9 shrink-0 rounded-lg object-contain" />;
}

function AppRow({ app }: { app: SubscriptionApp }) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 shadow-sm"
      style={{ borderColor: app.color }}
    >
      <AppIcon app={app} />
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className="truncate text-sm font-medium text-foreground">{app.name}</span>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex shrink-0 text-muted-foreground hover:text-foreground"
              aria-label={`О приложении ${app.name}`}
            >
              <HelpCircle className="size-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-64">
            <div className="flex flex-col gap-2 text-sm">
              <p className="font-medium text-popover-foreground">{app.name}</p>
              <p className="text-muted-foreground">{app.info}</p>
              <a
                href={appSearchUrl(app.searchQuery)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"
              >
                <Search className="size-3.5" />
                Найти в интернете
              </a>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <Button asChild size="sm" style={{ backgroundColor: app.color, color: "#fff" }}>
        <a href={app.url}>Добавить</a>
      </Button>
    </div>
  );
}

export function SubscriptionApps({ subUrl, name = "FastRayGram", className }: SubscriptionAppsProps) {
  const apps = useMemo(() => buildSubscriptionApps(subUrl, name), [subUrl, name]);
  const [platform, setPlatform] = useState<AppPlatform>(() => detectAppPlatform());

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      <Tabs value={platform} onValueChange={(value) => setPlatform(value as AppPlatform)}>
        <TabsList variant="line" className="w-full max-w-full justify-start">
          {(Object.keys(PLATFORM_LABELS) as AppPlatform[]).map((key) => (
            <TabsTrigger key={key} value={key} className="shrink-0 gap-1.5">
              <PlatformIcon platform={key} />
              {PLATFORM_LABELS[key]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="grid gap-2 sm:grid-cols-2">
        {apps[platform].map((app) => (
          <AppRow key={`${platform}-${app.name}`} app={app} />
        ))}
      </div>
    </div>
  );
}
