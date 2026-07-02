import { Outlet, useLocation } from "react-router-dom";

import { getNavChildByPath, getNavItemByPath } from "@/config/navigation";

import { AdminPageLayout } from "@/components/AdminPageLayout";
import { UserDetailModal } from "@/components/UserDetailModal";

import { useUsersAdmin } from "@/pages/users/useUsersAdmin";

export function UsersLayout() {
  const location = useLocation();
  const navItem = getNavItemByPath(location.pathname);
  const navChild = getNavChildByPath(location.pathname);
  const users = useUsersAdmin();

  return (
    <AdminPageLayout title={navChild?.label ?? navItem?.label ?? "Пользователи"} description={navItem?.hint}>
      <Outlet context={users} />
      <UserDetailModal open={users.detailUser !== null} user={users.detailUser} onClose={() => users.setDetailUser(null)} />
    </AdminPageLayout>
  );
}
