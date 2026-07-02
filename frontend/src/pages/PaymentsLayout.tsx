import { Outlet, useLocation } from "react-router-dom";

import { getNavChildByPath, getNavItemByPath } from "@/config/navigation";

import { AdminPageLayout } from "@/components/AdminPageLayout";

export function PaymentsLayout() {
  const location = useLocation();
  const navItem = getNavItemByPath(location.pathname);
  const navChild = getNavChildByPath(location.pathname);

  return (
    <AdminPageLayout title={navChild?.label ?? navItem?.label ?? "Платежи"} description={navItem?.hint}>
      <Outlet />
    </AdminPageLayout>
  );
}
