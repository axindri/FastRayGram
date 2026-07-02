import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { confirmPaymentReturn } from "@/api";
import { useAuth } from "@/auth";
import { ProfileResultPage } from "@/components/ProfileResultPage";

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const invoiceId = Number(searchParams.get("invoiceId"));
    const mdOrder = searchParams.get("mdOrder");

    if (!Number.isFinite(invoiceId) || invoiceId <= 0) {
      return;
    }

    void (async () => {
      try {
        await confirmPaymentReturn(invoiceId, mdOrder);
        await refreshUser();
      } catch {
        // Result page still shows success; profile can be refreshed manually.
      }
    })();
  }, [refreshUser, searchParams]);

  return (
    <ProfileResultPage
      status="success"
      title="Оплата прошла успешно"
      subTitle="Нужно ещё немного времени на обработку платежа в нашей системе, пожалуйста, подождите."
    />
  );
}
