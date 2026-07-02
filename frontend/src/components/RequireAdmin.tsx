import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../auth";
import { isAdminRole } from "../types";

export function RequireAdmin() {
  const { user } = useAuth();

  if (!user || !isAdminRole(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}
