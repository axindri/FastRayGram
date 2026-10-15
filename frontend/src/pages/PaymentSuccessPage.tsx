import { useEffect } from "react";

import { useAuth } from "@/auth";
import { ProfileResultPage } from "@/components/ProfileResultPage";

export function PaymentSuccessPage() {
  const { refreshUser } = useAuth();

  useEffect(() => {
    void refreshUser().catch(() => {
      // Result page still shows success; profile can be refreshed manually.
    });
  }, [refreshUser]);

  return (
    <ProfileResultPage
      status="success"
      title="Оплата прошла успешно"
      subTitle="Нужно ещё немного времени на обработку платежа в нашей системе, пожалуйста, подождите."
    />
  );
}
