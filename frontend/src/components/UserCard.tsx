import { Card, Space, Tag, Typography } from "antd";

import { ROLE_LABELS, type AdminUser } from "../types";

const { Text, Link } = Typography;

export function UserCard({ user }: { user: AdminUser }) {
  return (
    <Card size="small" title={user.username} extra={<Tag color="blue">{ROLE_LABELS[user.role]}</Tag>}>
      <Space orientation="vertical" size={4} style={{ width: "100%" }}>
        <Text type="secondary">ID: {user.id}</Text>
        {user.mark ? <Text type="secondary">Заметка: {user.mark}</Text> : <Text type="secondary">-</Text>}
        {user.sub_url ? (
          <Link href={user.sub_url} target="_blank">
            Ссылка подписки
          </Link>
        ) : null}
      </Space>
    </Card>
  );
}
