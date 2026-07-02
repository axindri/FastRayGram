import { Col, Flex, Row, Typography } from "antd";
import type { ReactNode } from "react";

const { Title } = Typography;

type AdminPageLayoutProps = {
  title: string;
  children: ReactNode;
};

export function AdminPageLayout({ title, children }: AdminPageLayoutProps) {
  return (
    <Flex vertical gap={16} style={{ width: "100%" }}>
      <Title level={3} style={{ marginTop: 0 }}>
        {title}
      </Title>
      <Row gutter={[0, 16]} align="top" style={{ width: "100%", marginInline: 0 }}>
        {children}
      </Row>
    </Flex>
  );
}

export function AdminPageColumn({ children, span = 12 }: { children: ReactNode; span?: number }) {
  return (
    <Col xs={24} lg={span} xl={span}>
      {children}
    </Col>
  );
}
