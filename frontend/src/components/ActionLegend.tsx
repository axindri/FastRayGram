import { Card, Flex, Space, Typography } from "antd";
import type { ReactNode } from "react";

const { Text } = Typography;

type ActionLegendItem = {
  icon: ReactNode;
  label: string;
};

type ActionLegendProps = {
  title?: string;
  items: ActionLegendItem[];
};

export function ActionLegend({ title = "Пояснение к кнопкам", items }: ActionLegendProps) {
  return (
    <Card size="small" title={title}>
      <Space orientation="vertical" size={6} style={{ width: "100%" }}>
        {items.map((item) => (
          <Flex key={item.label} align="center" gap={8}>
            <span style={{ display: "inline-flex", fontSize: 14 }}>{item.icon}</span>
            <Text type="secondary">{item.label}</Text>
          </Flex>
        ))}
      </Space>
    </Card>
  );
}
