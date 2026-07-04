import type { ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { PageShell } from "@/components/PageShell";
import { getNavChildByPath, getNavItemByPath } from "@/config/navigation";

function useNavSectionTitle(fallbackTitle: string) {
  const location = useLocation();
  const navItem = getNavItemByPath(location.pathname);
  const navChild = getNavChildByPath(location.pathname);

  return {
    title: navChild?.label ?? navItem?.label ?? fallbackTitle,
    description: navItem?.hint,
  };
}

export function NavAdminOutletLayout({ fallbackTitle }: { fallbackTitle: string }) {
  const { title, description } = useNavSectionTitle(fallbackTitle);

  return (
    <PageShell title={title} description={description}>
      <Outlet />
    </PageShell>
  );
}

export function NavSettingsOutletLayout({ fallbackTitle }: { fallbackTitle: string }) {
  const { title, description } = useNavSectionTitle(fallbackTitle);

  return (
    <PageShell title={title} description={description}>
      <Outlet />
    </PageShell>
  );
}

export function NavAdminSectionLayout({ fallbackTitle, children }: { fallbackTitle: string; children: ReactNode }) {
  const { title, description } = useNavSectionTitle(fallbackTitle);

  return (
    <PageShell title={title} description={description}>
      {children}
    </PageShell>
  );
}
