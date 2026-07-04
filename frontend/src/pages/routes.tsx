import { Loader2 } from "lucide-react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";

import { useAuth } from "@/auth";
import { AdminPageLayout } from "@/components/AdminPageLayout";
import { PageShell } from "@/components/PageShell";
import { RequireAdmin } from "@/components/RequireAdmin";
import { getNavChildByPath, getNavItemByPath } from "@/config/navigation";
import { AppLayout } from "@/layouts/AppLayout";
import { ForbiddenPage } from "@/pages/ForbiddenPage";
import { LoginPage } from "@/pages/LoginPage";
import { MonitoringPage } from "@/pages/MonitoringPage";
import { PaymentFailPage } from "@/pages/PaymentFailPage";
import { PaymentSuccessPage } from "@/pages/PaymentSuccessPage";
import { PaymentsAllPage, PaymentsPaidPage } from "@/pages/PaymentsPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { RegisterPage } from "@/pages/RegisterPage";
import { RegistrationPage } from "@/pages/RegistrationPage";
import { SettingsAppearancePage } from "@/pages/SettingsAppearancePage";
import { UsersAllPage } from "@/pages/users/AllPage";
import { UsersCreatePage } from "@/pages/users/CreatePage";
import { UsersXuiPage } from "@/pages/users/XuiPage";
import { UserDetailModal } from "@/pages/users/components/UserDetailModal";
import { useUsersAdmin } from "@/pages/users/useUsersAdmin";

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}

function UsersLayout() {
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

function PaymentsLayout() {
  const location = useLocation();
  const navItem = getNavItemByPath(location.pathname);
  const navChild = getNavChildByPath(location.pathname);

  return (
    <AdminPageLayout title={navChild?.label ?? navItem?.label ?? "Платежи"} description={navItem?.hint}>
      <Outlet />
    </AdminPageLayout>
  );
}

function SettingsLayout() {
  const location = useLocation();
  const navItem = getNavItemByPath(location.pathname);
  const navChild = getNavChildByPath(location.pathname);

  return (
    <PageShell title={navChild?.label ?? navItem?.label ?? "Настройки"} description={navItem?.hint}>
      <Outlet />
    </PageShell>
  );
}

function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/profile" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/profile" replace /> : <RegisterPage />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/profile" element={<ProfilePage />} />

        <Route path="/settings" element={<SettingsLayout />}>
          <Route index element={<Navigate to="/settings/appearance" replace />} />
          <Route path="appearance" element={<SettingsAppearancePage />} />
        </Route>
        <Route path="/appearance" element={<Navigate to="/settings/appearance" replace />} />

        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payment/fail" element={<PaymentFailPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route path="/" element={<Navigate to="/profile" replace />} />

        <Route element={<RequireAdmin />}>
          <Route path="/monitoring" element={<MonitoringPage />} />

          <Route path="/payments" element={<PaymentsLayout />}>
            <Route index element={<Navigate to="/payments/all" replace />} />
            <Route path="all" element={<PaymentsAllPage />} />
            <Route path="paid" element={<PaymentsPaidPage />} />
          </Route>

          <Route path="/users" element={<UsersLayout />}>
            <Route index element={<Navigate to="/users/create" replace />} />
            <Route path="create" element={<UsersCreatePage />} />
            <Route path="all" element={<UsersAllPage />} />
            <Route path="xui" element={<UsersXuiPage />} />
          </Route>

          <Route path="/registration" element={<RegistrationPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
