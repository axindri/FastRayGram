import { CopyOutlined } from "@ant-design/icons";
import { Button, Input, Space, Typography } from "antd";
import type { ReactNode } from "react";

import { useCopyToClipboard } from "../hooks/useCopyToClipboard";

const { Text } = Typography;

type CopyableInputProps = {
  value: string;
  label?: string;
  highlight?: boolean;
  buttonVariant?: "text" | "icon";
  maxWidth?: number;
};

export function CopyableInput({ value, label, highlight = false, buttonVariant = "text", maxWidth = 640 }: CopyableInputProps) {
  const copy = useCopyToClipboard();

  const copyButton =
    buttonVariant === "icon" ? (
      <Button icon={<CopyOutlined />} aria-label="Скопировать" onClick={() => copy(value)} />
    ) : (
      <Button onClick={() => copy(value)}>Скопировать</Button>
    );

  const input = (
    <Space.Compact style={{ width: "100%", maxWidth }}>
      <Input value={value} readOnly style={highlight ? { fontWeight: 600 } : undefined} />
      {copyButton}
    </Space.Compact>
  );

  if (!label) {
    return input;
  }

  return (
    <Space orientation="vertical" size={4} style={{ width: "100%" }}>
      <Text type="secondary">{label}</Text>
      {input}
    </Space>
  );
}

export function CopyableText({ value, children }: { value: string; children: ReactNode }) {
  const copy = useCopyToClipboard();

  return (
    <Text type="secondary" style={{ cursor: "pointer" }} onClick={() => copy(value)}>
      {children}
    </Text>
  );
}
