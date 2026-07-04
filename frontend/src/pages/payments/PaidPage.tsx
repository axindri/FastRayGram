import { FileSearch, Loader2, Receipt } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { checkInvoices } from "@/api";
import { InvoiceCard } from "@/components/InvoiceCard";
import { ListEmptyState } from "@/components/ListEmptyState";
import { Button } from "@/components/ui/button";
import type { Invoice } from "@/types";
import { getApiErrorMessage } from "@/utils/apiError";

export function PaymentsPaidPage() {
  const [checkedInvoices, setCheckedInvoices] = useState<Invoice[] | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);

  const onCheck = async () => {
    setCheckLoading(true);

    try {
      setCheckedInvoices(await checkInvoices());
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось проверить счета к оплате"));
    } finally {
      setCheckLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      {checkedInvoices === null ? (
        <ListEmptyState icon={FileSearch} title="Проверка не запускалась" description="Нажмите «Проверить», чтобы найти оплаченные счета в TimeWeb" />
      ) : checkedInvoices.length === 0 ? (
        <ListEmptyState icon={Receipt} title="Новых оплат нет" description="После проверки здесь появятся недавно оплаченные счета" />
      ) : (
        checkedInvoices.map((item) => <InvoiceCard key={item.id} item={item} />)
      )}
      <Button type="button" disabled={checkLoading} onClick={() => void onCheck()}>
        {checkLoading ? <Loader2 className="animate-spin" /> : null}
        Проверить
      </Button>
    </div>
  );
}
