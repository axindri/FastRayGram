import { useOutletContext } from "react-router-dom";

import type { UsersAdminContext } from "@/pages/users/useUsersAdmin";

export function useUsersContext() {
  return useOutletContext<UsersAdminContext>();
}
