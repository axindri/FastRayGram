import { BgColorsOutlined, CheckOutlined, DesktopOutlined, MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Button, Divider, Dropdown, Flex, Space, Typography, theme } from "antd";

import { useTheme } from "../theme/ThemeProvider";
import type { AccentId, ThemeMode } from "../theme/config";

const { Text } = Typography;

const MODE_LABELS: Record<ThemeMode, string> = {
  light: "Светлая",
  dark: "Тёмная",
  system: "Системная",
};

const MODE_ICONS: Record<ThemeMode, React.ReactNode> = {
  light: <SunOutlined />,
  dark: <MoonOutlined />,
  system: <DesktopOutlined />,
};

const MODES: ThemeMode[] = ["light", "dark", "system"];

function AccentSwatch({ label, color, selected, onClick }: { label: string; color: string; selected: boolean; onClick: () => void }) {
  const { token } = theme.useToken();

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      title={label}
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        padding: 0,
        borderRadius: 8,
        backgroundColor: color,
        border: selected ? `2px solid ${token.colorText}` : `1px solid ${token.colorBorderSecondary}`,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: selected ? `0 0 0 2px ${token.colorBgElevated}, 0 0 10px ${color}88` : undefined,
      }}
    >
      {selected ? <CheckOutlined style={{ color: "#fff", fontSize: 14 }} /> : null}
    </button>
  );
}

export function ThemeToggle() {
  const { mode, setMode, accentId, accentPresets, setAccentId } = useTheme();
  const { token } = theme.useToken();

  const panel = (
    <div
      onClick={(event) => event.stopPropagation()}
      style={{
        padding: "8px 4px 4px",
        minWidth: 220,
        background: token.colorBgElevated,
        borderRadius: token.borderRadiusLG,
        boxShadow: token.boxShadowSecondary,
      }}
    >
      <Text type="secondary" style={{ display: "block", paddingInline: 8, marginBottom: 8, fontSize: 12 }}>
        Тема
      </Text>
      <Space orientation="vertical" size={0} style={{ width: "100%" }}>
        {MODES.map((value) => (
          <Button key={value} type={mode === value ? "primary" : "text"} icon={MODE_ICONS[value]} block style={{ justifyContent: "flex-start" }} onClick={() => setMode(value)}>
            {MODE_LABELS[value]}
          </Button>
        ))}
      </Space>

      <Divider style={{ margin: "10px 0" }} />

      <Text type="secondary" style={{ display: "block", paddingInline: 8, marginBottom: 8, fontSize: 12 }}>
        Цвет
      </Text>
      <Flex wrap gap={8} style={{ paddingInline: 8, paddingBottom: 4 }}>
        {accentPresets.map(({ id, label, color }) => (
          <AccentSwatch key={id} label={label} color={color} selected={accentId === id} onClick={() => setAccentId(id as AccentId)} />
        ))}
      </Flex>
    </div>
  );

  return (
    <Dropdown popupRender={() => panel} trigger={["click"]} placement="top">
      <Button type="text" icon={<BgColorsOutlined />} aria-label="Оформление">
        Оформление
      </Button>
    </Dropdown>
  );
}
