import { ProfileResultPage } from "../components/ProfileResultPage";

export function ForbiddenPage() {
  return (
    <ProfileResultPage status="403" title="Доступ запрещён" subTitle="У вас нет прав для просмотра этой страницы." />
  );
}
