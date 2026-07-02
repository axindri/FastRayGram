import { Col, Row, Typography } from "antd";
import type { ReactNode } from "react";

const { Title } = Typography;

type AdminPageLayoutProps = {
  title: string;
  children: ReactNode;
};

export function AdminPageLayout({ title, children }: AdminPageLayoutProps) {
  return (
    <>
      <Title level={3} style={{ marginTop: 0 }}>
        {title}
      </Title>
      <Row gutter={[16, 16]} align="top" style={{ width: "100%" }}>
        {children}
      </Row>
    </>
  );
}

export function AdminPageColumn({ children, span = 12 }: { children: ReactNode; span?: number }) {
  return (
    <Col xs={24} lg={span} xl={span}>
      {children}
    </Col>
  );
}
