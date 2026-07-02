import { useCallback, useEffect, useRef, useState } from "react";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { App, Button, Empty, Input, Select, Space, Tabs } from "antd";

import { cancelInvoice, checkInvoices, fetchInvoices, type InvoiceListFilters } from "../api";
import { AdminPageColumn, AdminPageLayout } from "../components/AdminPageLayout";
import { AsyncListState } from "../components/AsyncListState";
import { InvoiceCard } from "../components/InvoiceCard";
import { PaginationFooter } from "../components/PaginationFooter";
import { SectionCard } from "../components/SectionCard";
import { getApiErrorMessage } from "../utils/apiError";
import { emptyPaginated } from "../utils/pagination";
import { USERNAME_MAX_LENGTH } from "../utils/username";
import type { AdminInvoice, Invoice, Paginated } from "../types";

type PaymentSearchField = "invoiceId" | "id" | "username";

const SEARCH_FIELD_LABELS: Record<PaymentSearchField, string> = {
  invoiceId: "Номер платежа",
  id: "ID платежа",
  username: "Имя пользователя",
};

export function PaymentsPage() {
  const { message } = App.useApp();
  const [checkedInvoices, setCheckedInvoices] = useState<Invoice[] | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);

  const [allInvoices, setAllInvoices] = useState<Paginated<AdminInvoice>>(() => emptyPaginated(3));
  const [allLoading, setAllLoading] = useState(false);
  const [searchField, setSearchField] = useState<PaymentSearchField>("invoiceId");
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
        message.error(getApiErrorMessage(error, "Не удалось загрузить счета к оплате"));
      } finally {
        setAllLoading(false);
      }
    },
    [allInvoices.limit, message],
  );

  useEffect(() => {
    void loadAllInvoices(1);
  }, [loadAllInvoices]);

  const onInvoiceSearch = (value: string) => {
    const trimmed = value.trim();

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
      message.warning("Введите целое число больше 0");
      return;
    }

    const filters: InvoiceListFilters = { [searchField]: parsed };
    setInvoiceFilters(filters);
    void loadAllInvoices(1, filters);
  };

  const onCheck = async () => {
    setCheckLoading(true);

    try {
      setCheckedInvoices(await checkInvoices());
      await loadAllInvoices(allInvoices.page);
    } catch (error) {
      message.error(getApiErrorMessage(error, "Не удалось проверить счета к оплате"));
    } finally {
      setCheckLoading(false);
    }
  };

  const onCancelInvoice = async (id: number) => {
    setCancelLoadingId(id);

    try {
      const invoice = await cancelInvoice(id);
      message.success(`Счет #${invoice.invoice_id} отменён`);
      await loadAllInvoices(allInvoices.page);
    } catch (error) {
      message.error(getApiErrorMessage(error, "Не удалось отменить счет к оплате"));
    } finally {
      setCancelLoadingId(null);
    }
  };

  const tabItems = [
    {
      key: "all",
      label: "Все счета",
      children: (
        <SectionCard
          title="Все счета"
          extra={
            <Button icon={<ReloadOutlined />} onClick={() => void loadAllInvoices(allInvoices.page)} loading={allLoading}>
              Обновить
            </Button>
          }
        >
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            <Space.Compact block style={{ width: "100%" }}>
              <Select
                value={searchField}
                options={Object.entries(SEARCH_FIELD_LABELS).map(([value, label]) => ({ value, label }))}
                onChange={(value: PaymentSearchField) => setSearchField(value)}
                style={{ width: 168 }}
              />
              <Input.Search
                allowClear
                placeholder={`Поиск: ${SEARCH_FIELD_LABELS[searchField]}`}
                enterButton={<SearchOutlined />}
                maxLength={searchField === "username" ? USERNAME_MAX_LENGTH : undefined}
                onSearch={onInvoiceSearch}
                onClear={() => onInvoiceSearch("")}
              />
            </Space.Compact>

            <AsyncListState loading={allLoading} empty={!allInvoices.items.length} emptyDescription="Счетов нет" minHeight={80}>
              {allInvoices.items.map((item) => (
                <InvoiceCard key={item.id} item={item} variant="admin" onCancel={onCancelInvoice} cancelLoadingId={cancelLoadingId} />
              ))}
            </AsyncListState>

            <PaginationFooter page={allInvoices.page} pages={allInvoices.pages} total={allInvoices.total} loading={allLoading} onPageChange={(page) => void loadAllInvoices(page)} />
          </Space>
        </SectionCard>
      ),
    },
    {
      key: "paid",
      label: "Оплаченные счета",
      children: (
        <SectionCard
          title="Оплаченные счета"
          hint="Проверка статуса оплаты в TimeWeb и продление подписок"
          extra={
            <Button type="primary" onClick={() => void onCheck()} loading={checkLoading}>
              Проверить
            </Button>
          }
        >
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            {checkedInvoices === null ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Проверка ещё не запускалась" />
            ) : checkedInvoices.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Новых оплаченных счетов нет" />
            ) : (
              checkedInvoices.map((item) => <InvoiceCard key={item.id} item={item} />)
            )}
          </Space>
        </SectionCard>
      ),
    },
  ];

  return (
    <AdminPageLayout title="Платежи">
      <AdminPageColumn span={24}>
        <Tabs items={tabItems} />
      </AdminPageColumn>
    </AdminPageLayout>
  );
}
