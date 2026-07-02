import { Outlet, useLocation } from "react-router-dom";

import { getNavChildByPath, getNavItemByPath } from "@/config/navigation";

import { PageShell } from "@/components/PageShell";

export function SettingsLayout() {
  const location = useLocation();
  const navItem = getNavItemByPath(location.pathname);
  const navChild = getNavChildByPath(location.pathname);

  return (
    <PageShell title={navChild?.label ?? navItem?.label ?? "Настройки"} description={navItem?.hint}>
      <Outlet />
    </PageShell>
  );
}
