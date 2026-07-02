import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./auth";
import { RequireAdmin } from "./components/RequireAdmin";
import { AppLayout } from "./layouts/AppLayout";
import { ForbiddenPage } from "./pages/ForbiddenPage";
import { LoginPage } from "./pages/LoginPage";
import { MonitoringPage } from "./pages/MonitoringPage";
import { PaymentFailPage } from "./pages/PaymentFailPage";
import { PaymentSuccessPage } from "./pages/PaymentSuccessPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RegisterPage } from "./pages/RegisterPage";
import { RegistrationPage } from "./pages/RegistrationPage";
import { UsersPage } from "./pages/UsersPage";

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}

function LoadingScreen() {
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <Spin indicator={<LoadingOutlined spin />} size="large" />
    </div>
  );
}

export default function App() {
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
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payment/fail" element={<PaymentFailPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route path="/" element={<Navigate to="/profile" replace />} />

        <Route element={<RequireAdmin />}>
          <Route path="/monitoring" element={<MonitoringPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/registration" element={<RegistrationPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
