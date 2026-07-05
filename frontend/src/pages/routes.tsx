import { Navigate, Route, Routes } from "react-router-dom";

import { TOO_MANY_REQUESTS_PATH } from "@/constants";

import { useAuth } from "@/auth";
import { LoadingScreen } from "@/components/LoadingScreen";
import { RequireAdmin } from "@/components/RequireAdmin";
import { AppLayout } from "@/layouts/AppLayout";
import { NavAdminOutletLayout, NavAdminSectionLayout, NavSettingsOutletLayout } from "@/layouts/NavSectionLayout";
import { ForbiddenPage } from "@/pages/ForbiddenPage";
import { LoginPage } from "@/pages/LoginPage";
import { MonitoringPage } from "@/pages/MonitoringPage";
import { PaymentFailPage } from "@/pages/PaymentFailPage";
import { PaymentSuccessPage } from "@/pages/PaymentSuccessPage";
import { PaymentsAllPage } from "@/pages/payments/AllPage";
import { PaymentsPaidPage } from "@/pages/payments/PaidPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { RegisterPage } from "@/pages/RegisterPage";
import { RegistrationPage } from "@/pages/RegistrationPage";
import { SettingsAppearancePage } from "@/pages/SettingsAppearancePage";
import { TooManyRequestsPage } from "@/pages/TooManyRequestsPage";
import { UsersAllPage } from "@/pages/users/AllPage";
import { UsersCreatePage } from "@/pages/users/CreatePage";
import { UsersXuiPage } from "@/pages/users/XuiPage";

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}

export function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path={TOO_MANY_REQUESTS_PATH} element={<TooManyRequestsPage />} />
      <Route path="/login" element={user ? <Navigate to="/profile" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/profile" replace /> : <RegisterPage />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/profile" element={<ProfilePage />} />

        <Route path="/settings" element={<NavSettingsOutletLayout fallbackTitle="Настройки" />}>
          <Route index element={<Navigate to="/settings/appearance" replace />} />
          <Route path="appearance" element={<SettingsAppearancePage />} />
        </Route>
        <Route path="/appearance" element={<Navigate to="/settings/appearance" replace />} />

        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payment/fail" element={<PaymentFailPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route path="/" element={<Navigate to="/profile" replace />} />

        <Route element={<RequireAdmin />}>
          <Route
            path="/monitoring"
            element={
              <NavAdminSectionLayout fallbackTitle="Мониторинг">
                <MonitoringPage />
              </NavAdminSectionLayout>
            }
          />

          <Route path="/payments" element={<NavAdminOutletLayout fallbackTitle="Платежи" />}>
            <Route index element={<Navigate to="/payments/all" replace />} />
            <Route path="all" element={<PaymentsAllPage />} />
            <Route path="paid" element={<PaymentsPaidPage />} />
          </Route>

          <Route path="/users" element={<NavAdminOutletLayout fallbackTitle="Пользователи" />}>
            <Route index element={<Navigate to="/users/create" replace />} />
            <Route path="create" element={<UsersCreatePage />} />
            <Route path="all" element={<UsersAllPage />} />
            <Route path="xui" element={<UsersXuiPage />} />
          </Route>

          <Route
            path="/registration"
            element={
              <NavAdminSectionLayout fallbackTitle="Регистрация">
                <RegistrationPage />
              </NavAdminSectionLayout>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
