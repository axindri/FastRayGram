import { Card, Typography } from "antd";
import type { ReactNode } from "react";

const { Text } = Typography;

type SectionCardProps = {
  title: ReactNode;
  hint?: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
};

export function SectionCard({ title, hint, extra, children }: SectionCardProps) {
  return (
    <Card title={title} extra={extra}>
      {hint ? (typeof hint === "string" ? <Text type="secondary">{hint}</Text> : hint) : null}
      <div style={hint ? { marginTop: 16 } : undefined}>{children}</div>
    </Card>
  );
}
