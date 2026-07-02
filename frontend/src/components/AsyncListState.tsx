import { Empty, Flex, Space, Spin } from "antd";
import type { ReactNode } from "react";

type AsyncListStateProps = {
  loading: boolean;
  empty: boolean;
  emptyDescription: string;
  children: ReactNode;
  minHeight?: number;
  size?: "default" | "large";
};

export function AsyncListState({ loading, empty, emptyDescription, children, minHeight = 120, size = "large" }: AsyncListStateProps) {
  if (loading && empty) {
    return (
      <Flex justify="center" align="center" style={{ minHeight, padding: size === "large" ? "24px 0" : undefined }}>
        <Spin size={size} />
      </Flex>
    );
  }

  if (!loading && empty) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyDescription} />;
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      {children}
    </Space>
  );
}
