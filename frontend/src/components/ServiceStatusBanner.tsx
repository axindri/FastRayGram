import { Alert } from "antd";

import { useServiceStatus } from "../hooks/useServiceStatus";

const CONTACT_MESSAGE = "По всем вопросам обращайтесь к администратору или в личные сообщения группы.";

export function ServiceStatusBanner() {
  const { loading, statusError, paymentBlocked } = useServiceStatus();

  if (loading || !paymentBlocked) {
    return null;
  }

  const warning = statusError
    ? {
        title: "Не удалось проверить статус сервисов",
        description: `Платежи отключены до восстановления работоспособности. ${CONTACT_MESSAGE}`,
      }
    : {
        title: "Некоторые сервисы временно недоступны",
        description: `Платежи отключены до восстановления работоспособности. ${CONTACT_MESSAGE}`,
      };

  return <Alert type="warning" title={warning.title} description={warning.description} banner showIcon style={{ padding: 12 }} />;
}
