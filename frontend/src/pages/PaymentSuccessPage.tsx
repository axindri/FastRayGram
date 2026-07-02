import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { confirmPaymentReturn } from "../api";
import { ProfileResultPage } from "../components/ProfileResultPage";
import { useAuth } from "../auth";

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
      title="Оплата прошла успешно. Нужно еще немного времени на обработу платежа в нашей системе, пожалуйста, подождите."
    />
  );
}
