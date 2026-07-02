import { Empty, Typography } from "antd";

import { UserCard } from "./UserCard";
import type { AdminUser } from "../types";

const { Text } = Typography;

export type UserLookupState = "idle" | "found" | "not_found";

type UserLookupPanelProps = {
  loading: boolean;
  lookup: UserLookupState;
  user: AdminUser | null;
};

export function UserLookupPanel({ loading, lookup, user }: UserLookupPanelProps) {
  if (loading) {
    return (
      <div style={{ marginTop: 16 }}>
        <Text type="secondary">Загружаю...</Text>
      </div>
    );
  }

  if (lookup === "not_found") {
    return (
      <div style={{ marginTop: 16 }}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Пользователь не найден" />
      </div>
    );
  }

  if (user) {
    return (
      <div style={{ marginTop: 16 }}>
        <UserCard user={user} />
      </div>
    );
  }

  return null;
}
