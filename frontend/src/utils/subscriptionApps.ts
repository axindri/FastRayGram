export type AppPlatform = "all" | "android" | "ios" | "macos" | "windows" | "linux";

export type SubscriptionApp = {
  name: string;
  url: string;
  icon: string;
  /** Line-art SVG — tint with brand color via CSS mask */
  tinted?: boolean;
  color: string;
  info: string;
  searchQuery: string;
};

type AppMeta = {
  src: string;
  tinted?: boolean;
  color: string;
  info: string;
  searchQuery?: string;
};

export const SUBSCRIPTION_APP_ICONS: Record<string, AppMeta> = {
  V2Box: {
    src: "/app-icons/v2box.webp",
    color: "#3b82f6",
    info: "Кроссплатформенный клиент V2Ray/Xray. Есть на Android и iOS.",
    searchQuery: "V2Box VPN",
  },
  V2RayNG: {
    src: "/app-icons/v2rayng.svg",
    tinted: true,
    color: "#2563eb",
    info: "Популярный open-source клиент V2Ray для Android.",
    searchQuery: "v2rayNG",
  },
  "Sing-box": {
    src: "/app-icons/sing-box.svg",
    tinted: true,
    color: "#0ea5e9",
    info: "Официальный GUI для ядра sing-box (SFA/SFI/SFM).",
    searchQuery: "sing-box client",
  },
  V2RayTun: {
    src: "/app-icons/v2raytun.png",
    color: "#2563eb",
    info: "Кроссплатформенный клиент на Xray: Android, iOS, Windows, macOS, Linux.",
    searchQuery: "v2raytun",
  },
  Happ: {
    src: "/app-icons/happ.svg",
    tinted: true,
    color: "#6366f1",
    info: "Удобный proxy-клиент с подписками. Есть мобильные и desktop-версии.",
    searchQuery: "Happ proxy",
  },
  Incy: {
    src: "/app-icons/incy.webp",
    color: "#16a34a",
    info: "Кроссплатформенный клиент на Xray: мобильные и desktop (Windows, macOS, Linux).",
    searchQuery: "INCY proxy",
  },
  Shadowrocket: {
    src: "/app-icons/shadowrocket.webp",
    color: "#3b82f6",
    info: "Платный rule-based клиент для iOS / Apple platforms.",
    searchQuery: "Shadowrocket",
  },
  Streisand: {
    src: "/app-icons/streisand.webp",
    color: "#ec4899",
    info: "Бесплатный клиент для iOS с поддержкой современных протоколов.",
    searchQuery: "Streisand VPN iOS",
  },
  Hiddify: {
    src: "/app-icons/hiddify.webp",
    color: "#1d4ed8",
    info: "Мультиплатформенный клиент (Android, iOS, Windows, macOS, Linux).",
    searchQuery: "Hiddify",
  },
  "Clash Verge": {
    src: "/app-icons/clash-verge.png",
    color: "#0ea5e9",
    info: "Desktop-клиент Clash Meta (Clash Verge Rev) для Windows, macOS и Linux.",
    searchQuery: "Clash Verge Rev",
  },
  FlClash: {
    src: "/app-icons/flclash.png",
    color: "#22c55e",
    info: "Кроссплатформенный Clash Meta клиент на Flutter.",
    searchQuery: "FlClash",
  },
  NekoRay: {
    src: "/app-icons/nekoray.png",
    color: "#f97316",
    info: "Desktop GUI (NekoBox/NekoRay) для Windows и Linux на базе sing-box / Xray.",
    searchQuery: "NekoRay NekoBox",
  },
};

export function appSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function toBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function detectAppPlatform(userAgent = navigator.userAgent): AppPlatform {
  if (/iphone|ipad|ipod/i.test(userAgent)) {
    return "ios";
  }
  if (/android/i.test(userAgent)) {
    return "android";
  }
  if (/macintosh|mac os x/i.test(userAgent)) {
    return "macos";
  }
  if (/windows/i.test(userAgent)) {
    return "windows";
  }
  if (/linux/i.test(userAgent) && !/android/i.test(userAgent)) {
    return "linux";
  }
  return "all";
}

function uniqueByName(apps: SubscriptionApp[]): SubscriptionApp[] {
  const seen = new Set<string>();
  return apps.filter((app) => {
    if (seen.has(app.name)) {
      return false;
    }
    seen.add(app.name);
    return true;
  });
}

export function buildSubscriptionApps(subUrl: string, name = "FastRayGram"): Record<AppPlatform, SubscriptionApp[]> {
  const encSub = encodeURIComponent(subUrl);
  const profileName = encodeURIComponent(name);
  const rocketSource = `${subUrl}${subUrl.includes("?") ? "&" : "?"}flag=shadowrocket`;

  const withIcon = (appName: string, url: string): SubscriptionApp => {
    const icon = SUBSCRIPTION_APP_ICONS[appName];
    return {
      name: appName,
      url,
      icon: icon?.src ?? "",
      tinted: icon?.tinted,
      color: icon?.color ?? "#64748b",
      info: icon?.info ?? "VPN/proxy-клиент для подключения по ссылке подписки.",
      searchQuery: icon?.searchQuery ?? appName,
    };
  };

  const v2box = withIcon("V2Box", `v2box://install-sub?url=${encSub}&name=${profileName}`);
  const singBox = withIcon("Sing-box", `sing-box://import-remote-profile?url=${encSub}#${profileName}`);
  const v2raytun = withIcon("V2RayTun", `v2raytun://import/${subUrl}`);
  const happ = withIcon("Happ", `happ://add/${subUrl}`);
  const incy = withIcon("Incy", `incy://add/${subUrl}`);
  const hiddify = withIcon("Hiddify", `hiddify://install-config/?url=${encSub}`);
  const clashVerge = withIcon("Clash Verge", `clash-verge://install-config?url=${encSub}&name=${profileName}`);
  const flclash = withIcon("FlClash", `flclash://install-config?url=${encSub}`);
  const nekoray = withIcon("NekoRay", `sn://subscription?url=${encSub}&name=${profileName}`);

  // Apple platforms share the same App Store clients.
  const apple = [
    withIcon("Shadowrocket", `shadowrocket://add/sub://${toBase64(rocketSource)}?remark=${profileName}`),
    v2box,
    withIcon("Streisand", `streisand://import/${encSub}`),
    v2raytun,
    happ,
    incy,
    singBox,
  ];

  const android = [
    v2box,
    withIcon("V2RayNG", `v2rayng://install-config?url=${encSub}`),
    singBox,
    v2raytun,
    happ,
    incy,
    hiddify,
  ];

  // Desktop clients with Windows / Linux builds + deep links.
  const windows = [incy, v2raytun, happ, hiddify, clashVerge, flclash, nekoray];
  const linux = [incy, v2raytun, hiddify, clashVerge, flclash, nekoray];

  const all = uniqueByName([...android, ...apple, ...windows, ...linux]);

  return {
    all,
    android,
    ios: apple,
    macos: apple,
    windows,
    linux,
  };
}
