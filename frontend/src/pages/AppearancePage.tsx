import { BgColorsOutlined } from "@ant-design/icons";
import { Flex, Typography } from "antd";

import { AccentColorPicker, ThemeModePicker } from "../components/AppearanceSettings";
import { SectionCard } from "../components/SectionCard";
import { ThemedIconAvatar } from "../components/ThemedIconAvatar";

const { Title } = Typography;

export function AppearancePage() {
  return (
    <>
      <Title level={3} style={{ marginTop: 0 }}>
        Оформление
      </Title>

      <Flex vertical gap={16}>
        <SectionCard
          title={
            <Flex align="center" gap={8}>
              <ThemedIconAvatar shape="square" size="small" icon={<BgColorsOutlined />} />
              <span>Тема</span>
            </Flex>
          }
          hint="Светлая, тёмная или как в системе"
        >
          <ThemeModePicker />
        </SectionCard>

        <SectionCard title="Акцентный цвет" hint="Основной цвет кнопок и выделений в интерфейсе">
          <AccentColorPicker />
        </SectionCard>
      </Flex>
    </>
  );
}
