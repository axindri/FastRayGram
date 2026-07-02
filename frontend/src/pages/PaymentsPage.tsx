import { FileSearch, Loader2, Receipt, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { cancelInvoice, checkInvoices, fetchInvoices, type InvoiceListFilters } from "@/api";
import { InvoiceCard } from "@/components/InvoiceCard";
import { ListEmptyState } from "@/components/ListEmptyState";
import { PaginatedList } from "@/components/PaginatedList";
import { SectionCard } from "@/components/SectionCard";
import { getApiErrorMessage } from "@/utils/apiError";
import { emptyPaginated } from "@/utils/pagination";
import { PAYMENT_SEARCH_FIELD_LABELS, USERNAME_MAX_LENGTH, type PaymentSearchField } from "@/constants";
import type { AdminInvoice, Invoice, Paginated } from "@/types";

export function PaymentsAllPage() {
  const [allInvoices, setAllInvoices] = useState<Paginated<AdminInvoice>>(() => emptyPaginated(3));
  const [allLoading, setAllLoading] = useState(false);
  const [searchField, setSearchField] = useState<PaymentSearchField>("invoiceId");
  const [searchValue, setSearchValue] = useState("");
  const [invoiceFilters, setInvoiceFilters] = useState<InvoiceListFilters>({});
  const invoiceFiltersRef = useRef(invoiceFilters);
  invoiceFiltersRef.current = invoiceFilters;
  const [cancelLoadingId, setCancelLoadingId] = useState<number | null>(null);

  const loadAllInvoices = useCallback(
    async (page: number, filters?: InvoiceListFilters) => {
      const query = filters ?? invoiceFiltersRef.current;
      setAllLoading(true);

      try {
        setAllInvoices(await fetchInvoices(page, allInvoices.limit, Object.keys(query).length ? query : undefined));
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Не удалось загрузить счета к оплате"));
      } finally {
        setAllLoading(false);
      }
    },
    [allInvoices.limit],
  );

  useEffect(() => {
    void loadAllInvoices(1);
  }, [loadAllInvoices]);

  const onInvoiceSearch = (value: string) => {
    const trimmed = value.trim();
    setSearchValue(value);

    if (!trimmed) {
      setInvoiceFilters({});
      void loadAllInvoices(1, {});
      return;
    }

    if (searchField === "username") {
      const filters: InvoiceListFilters = { username: trimmed };
      setInvoiceFilters(filters);
      void loadAllInvoices(1, filters);
      return;
    }

    const parsed = Number(trimmed);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      toast.warning("Введите целое число больше 0");
      return;
    }

    const filters: InvoiceListFilters = { [searchField]: parsed };
    setInvoiceFilters(filters);
    void loadAllInvoices(1, filters);
  };

  const onCancelInvoice = async (id: number) => {
    setCancelLoadingId(id);

    try {
      const invoice = await cancelInvoice(id);
      toast.success(`Счет #${invoice.invoice_id} отменён`);
      await loadAllInvoices(allInvoices.page);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось отменить счет к оплате"));
    } finally {
      setCancelLoadingId(null);
    }
  };

  return (
    <SectionCard
      title="Все счета"
      extra={
        <Button type="button" variant="outline" size="sm" disabled={allLoading} onClick={() => void loadAllInvoices(allInvoices.page)}>
          {allLoading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          Обновить
        </Button>
      }
    >
      <div className="flex w-full flex-col gap-4">
        <div className="flex w-full flex-col sm:flex-row">
          <Select value={searchField} onValueChange={(value) => setSearchField(value as PaymentSearchField)}>
            <SelectTrigger className="w-full sm:w-[168px] sm:rounded-r-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PAYMENT_SEARCH_FIELD_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex min-w-0 flex-1">
            <Input
              value={searchValue}
              placeholder={`Поиск: ${PAYMENT_SEARCH_FIELD_LABELS[searchField]}`}
              maxLength={searchField === "username" ? USERNAME_MAX_LENGTH : undefined}
              className="rounded-r-none sm:rounded-none"
              onChange={(event) => {
                const next = event.target.value;
                setSearchValue(next);
                if (!next) {
                  onInvoiceSearch("");
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onInvoiceSearch(searchValue);
                }
              }}
            />
            <Button type="button" variant="outline" className="rounded-l-none shrink-0" onClick={() => onInvoiceSearch(searchValue)}>
              <Search />
            </Button>
          </div>
        </div>

        <PaginatedList
          page={allInvoices.page}
          pages={allInvoices.pages}
          total={allInvoices.total}
          loading={allLoading}
          empty={!allInvoices.items.length}
          emptyDescription="Счетов нет"
          emptyTitle="Счетов нет"
          onPageChange={(page) => void loadAllInvoices(page)}
        >
          {allInvoices.items.map((item) => (
            <InvoiceCard key={item.id} item={item} access="admin" onCancel={onCancelInvoice} cancelLoadingId={cancelLoadingId} />
          ))}
        </PaginatedList>
      </div>
    </SectionCard>
  );
}

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
    <SectionCard
      title="Оплаченные счета"
      hint="Проверка статуса оплаты в TimeWeb и продление подписок"
      extra={
        <Button type="button" disabled={checkLoading} onClick={() => void onCheck()}>
          {checkLoading ? <Loader2 className="animate-spin" /> : null}
          Проверить
        </Button>
      }
    >
      <div className="flex w-full flex-col gap-4">
        {checkedInvoices === null ? (
          <ListEmptyState icon={FileSearch} title="Проверка не запускалась" description="Нажмите «Проверить», чтобы найти оплаченные счета в TimeWeb" />
        ) : checkedInvoices.length === 0 ? (
          <ListEmptyState icon={Receipt} title="Новых оплат нет" description="После проверки здесь появятся недавно оплаченные счета" />
        ) : (
          checkedInvoices.map((item) => <InvoiceCard key={item.id} item={item} />)
        )}
      </div>
    </SectionCard>
  );
}
