import { QuestionCircleOutlined } from "@ant-design/icons";
import { Tooltip, theme } from "antd";
import type { ReactNode } from "react";

type HintTooltipProps = {
  title: ReactNode;
};

export function HintTooltip({ title }: HintTooltipProps) {
  const { token } = theme.useToken();

  return (
    <Tooltip title={title}>
      <QuestionCircleOutlined
        aria-label="Подсказка"
        style={{ color: token.colorTextDescription, cursor: "help", fontSize: 14 }}
      />
    </Tooltip>
  );
}
