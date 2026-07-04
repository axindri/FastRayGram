import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { cancelInvoice, fetchInvoices, type InvoiceListFilters } from "@/api";
import { InvoiceCard } from "@/components/InvoiceCard";
import { PaginatedList } from "@/components/PaginatedList";
import { SearchInputGroup } from "@/components/SearchInputGroup";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PAYMENT_SEARCH_FIELD_LABELS, USERNAME_MAX_LENGTH, type PaymentSearchField } from "@/constants";
import type { AdminInvoice, Paginated } from "@/types";
import { getApiErrorMessage } from "@/utils/apiError";
import { emptyPaginated } from "@/utils/pagination";

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
    <div className="flex w-full flex-col gap-4">
      <SearchInputGroup
        value={searchValue}
        placeholder="Поиск"
        maxLength={searchField === "username" ? USERNAME_MAX_LENGTH : undefined}
        loading={allLoading}
        leading={
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
        }
        onChange={(next) => {
          setSearchValue(next);
          if (!next) {
            onInvoiceSearch("");
          }
        }}
        onSearch={() => onInvoiceSearch(searchValue)}
        onRefresh={() => void loadAllInvoices(allInvoices.page)}
      />

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
  );
}
