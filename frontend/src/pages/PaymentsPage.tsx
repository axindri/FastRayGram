import { useCallback, useEffect, useState } from "react";
import { ReloadOutlined } from "@ant-design/icons";
import { App, Button, Empty, Form, InputNumber, Space } from "antd";

import { cancelInvoice, checkInvoices, fetchInvoices } from "../api";
import { AdminPageColumn, AdminPageLayout } from "../components/AdminPageLayout";
import { AsyncListState } from "../components/AsyncListState";
import { CompactFormAction } from "../components/LookupActionForm";
import { InvoiceCard } from "../components/InvoiceCard";
import { PaginationFooter } from "../components/PaginationFooter";
import { SectionCard } from "../components/SectionCard";
import { getApiErrorMessage } from "../utils/apiError";
import { emptyPaginated } from "../utils/pagination";
import type { AdminInvoice, Invoice, Paginated } from "../types";

export function PaymentsPage() {
  const { message } = App.useApp();
  const [checkedInvoices, setCheckedInvoices] = useState<Invoice[] | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);

  const [allInvoices, setAllInvoices] = useState<Paginated<AdminInvoice>>(() => emptyPaginated(3));
  const [allLoading, setAllLoading] = useState(false);

  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelForm] = Form.useForm<{ id: number }>();

  const loadAllInvoices = useCallback(
    async (page: number) => {
      setAllLoading(true);

      try {
        setAllInvoices(await fetchInvoices(page, allInvoices.limit));
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

  const onCancel = async (values: { id: number }) => {
    setCancelLoading(true);

    try {
      const invoice = await cancelInvoice(values.id);
      message.success(`Счет #${invoice.invoice_id} отменён`);
      cancelForm.resetFields();
      await loadAllInvoices(allInvoices.page);
    } catch (error) {
      message.error(getApiErrorMessage(error, "Не удалось отменить счет к оплате"));
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <AdminPageLayout title="Платежи">
      <AdminPageColumn>
        <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
          <SectionCard
            title="Оплаченные счета"
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

          <SectionCard title="Отменить счет" hint="Принудительно перевести счет в статус «Отменён».">
            <Form id="cancel-invoice-form" form={cancelForm} layout="vertical" onFinish={onCancel} style={{ marginBottom: 0 }}>
              <CompactFormAction
                label="Идентификатор (ID)"
                name="id"
                input={<InputNumber placeholder="1" style={{ width: "100%" }} />}
                loading={cancelLoading}
                submitLabel="Отменить"
                danger
                rules={[{ required: true, message: "Введите ID" }]}
              />
            </Form>
          </SectionCard>
        </Space>
      </AdminPageColumn>

      <AdminPageColumn>
        <SectionCard
          title="Все счета"
          extra={
            <Button icon={<ReloadOutlined />} onClick={() => void loadAllInvoices(1)} loading={allLoading}>
              Обновить
            </Button>
          }
        >
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            <AsyncListState loading={allLoading} empty={!allInvoices.items.length} emptyDescription="Счетов нет" minHeight={80}>
              {allInvoices.items.map((item) => (
                <InvoiceCard key={item.id} item={item} variant="admin" />
              ))}
            </AsyncListState>

            <PaginationFooter page={allInvoices.page} pages={allInvoices.pages} total={allInvoices.total} loading={allLoading} onPageChange={(page) => void loadAllInvoices(page)} />
          </Space>
        </SectionCard>
      </AdminPageColumn>
    </AdminPageLayout>
  );
}
