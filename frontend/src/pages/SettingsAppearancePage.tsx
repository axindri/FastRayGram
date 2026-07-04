import { ThemeModePicker } from "@/components/AppearanceSettings";
import { SectionCard } from "@/components/SectionCard";

export function SettingsAppearancePage() {
  return (
    <SectionCard title="Тема" hint="Выберите светлую, тёмную или системную тему. Настройка сохраняется в браузере.">
      <ThemeModePicker />
    </SectionCard>
  );
}
