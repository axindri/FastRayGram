import { CheckOutlined, DesktopOutlined, MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Button, Flex, Space, Typography, theme } from "antd";

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

export function ThemeModePicker() {
  const { mode, setMode } = useTheme();

  return (
    <Space orientation="vertical" size={8} style={{ width: "100%", maxWidth: 320 }}>
      {MODES.map((value) => (
        <Button key={value} type={mode === value ? "primary" : "default"} icon={MODE_ICONS[value]} block style={{ justifyContent: "flex-start" }} onClick={() => setMode(value)}>
          {MODE_LABELS[value]}
        </Button>
      ))}
    </Space>
  );
}

export function AccentColorPicker() {
  const { accentId, accentPresets, setAccentId } = useTheme();

  return (
    <Flex wrap gap={8}>
      {accentPresets.map(({ id, label, color }) => (
        <Flex key={id} vertical align="center" gap={4}>
          <AccentSwatch label={label} color={color} selected={accentId === id} onClick={() => setAccentId(id as AccentId)} />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {label}
          </Text>
        </Flex>
      ))}
    </Flex>
  );
}

export function AppearanceSettingsPanel() {
  return (
    <>
      <Text type="secondary" style={{ display: "block", marginBottom: 8, fontSize: 12 }}>
        Тема
      </Text>
      <ThemeModePicker />

      <Text type="secondary" style={{ display: "block", marginTop: 16, marginBottom: 8, fontSize: 12 }}>
        Цвет
      </Text>
      <AccentColorPicker />
    </>
  );
}
