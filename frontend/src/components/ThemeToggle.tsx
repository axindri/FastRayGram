import { BgColorsOutlined } from "@ant-design/icons";
import { Button, Dropdown, theme } from "antd";

import { AppearanceSettingsPanel } from "./AppearanceSettings";

export function ThemeToggle({ block = false }: { block?: boolean }) {
  const { token } = theme.useToken();

  const panel = (
    <div
      onClick={(event) => event.stopPropagation()}
      style={{
        padding: "12px 12px 8px",
        minWidth: 220,
        background: token.colorBgElevated,
        borderRadius: token.borderRadiusLG,
        boxShadow: token.boxShadowSecondary,
      }}
    >
      <AppearanceSettingsPanel />
    </div>
  );

  return (
    <Dropdown popupRender={() => panel} trigger={["click"]} placement="top">
      <Button type="text" block={block} icon={<BgColorsOutlined />} aria-label="Оформление">
        Оформление
      </Button>
    </Dropdown>
  );
}
