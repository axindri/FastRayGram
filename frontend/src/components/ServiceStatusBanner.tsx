import { AlertTriangle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CONTACT_MESSAGE } from "@/constants";
import { useServiceStatus } from "@/hooks/useServiceStatus";

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

  return (
    <Alert className="mx-auto w-full border-amber-500/50 bg-amber-50 text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-50">
      <AlertTriangle className="text-amber-600 dark:text-amber-400" />
      <AlertTitle>{warning.title}</AlertTitle>
      <AlertDescription>{warning.description}</AlertDescription>
    </Alert>
  );
}
