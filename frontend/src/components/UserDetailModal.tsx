import { useCallback, useEffect, useState } from "react";
import { FileOutlined, LinkOutlined } from "@ant-design/icons";
import { Card, Empty, Flex, Modal, Space, Spin, Typography } from "antd";

import { ApiError, fetchInvoices, fetchXuiClient } from "../api";
import { getApiErrorMessage } from "../utils/apiError";
import { emptyPaginated } from "../utils/pagination";
import { ROLE_LABELS, type AdminInvoice, type AdminUser, type Paginated, type XuiClient } from "../types";
import { AsyncListState } from "./AsyncListState";
import { InvoiceCard } from "./InvoiceCard";
import { PaginationFooter } from "./PaginationFooter";
import { ThemedIconAvatar } from "./ThemedIconAvatar";
import { XuiClientCard } from "./XuiClientCard";

const { Link, Text } = Typography;

const INVOICES_PAGE_LIMIT = 3;

type UserDetailModalProps = {
  open: boolean;
  user: AdminUser | null;
  onClose: () => void;
};

export function UserDetailModal({ open, user, onClose }: UserDetailModalProps) {
  const [xuiClient, setXuiClient] = useState<XuiClient | null>(null);
  const [xuiLoading, setXuiLoading] = useState(false);
  const [xuiError, setXuiError] = useState<string | null>(null);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);

  const [invoices, setInvoices] = useState<Paginated<AdminInvoice>>(() => emptyPaginated(INVOICES_PAGE_LIMIT));
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  const loadInvoices = useCallback(async (page: number, userId: number) => {
    setInvoicesLoading(true);
    setInvoicesError(null);

    try {
      setInvoices(await fetchInvoices(page, INVOICES_PAGE_LIMIT, { userId }));
    } catch (error) {
      setInvoices(emptyPaginated(INVOICES_PAGE_LIMIT));
      setInvoicesError(getApiErrorMessage(error, "Не удалось загрузить счета"));
    } finally {
      setInvoicesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !user) {
      setXuiClient(null);
      setXuiError(null);
      setInvoicesError(null);
      setInvoices(emptyPaginated(INVOICES_PAGE_LIMIT));
      return;
    }

    let cancelled = false;
    setXuiLoading(true);
    setXuiClient(null);
    setXuiError(null);
    setInvoices(emptyPaginated(INVOICES_PAGE_LIMIT));

    void fetchXuiClient(user.username)
      .then((client) => {
        if (!cancelled) {
          setXuiClient(client);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          if (error instanceof ApiError && error.status === 404) {
            setXuiError(null);
          } else {
            setXuiError(getApiErrorMessage(error, "Не удалось загрузить XUI-клиента"));
          }
        }
      })
      .finally(() => {
        if (!cancelled) {
          setXuiLoading(false);
        }
      });

    void loadInvoices(1, user.id);

    return () => {
      cancelled = true;
    };
  }, [loadInvoices, open, user]);

  return (
    <Modal title={user?.username ?? "Пользователь"} open={open} centered onCancel={onClose} footer={null} width={720} destroyOnHidden>
      {user ? (
        <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
          <Card size="small" styles={{ body: { padding: 12 } }}>
            <Space orientation="vertical" size={8} style={{ width: "100%" }}>
              <Text type="secondary">ID: {user.id}</Text>
              <Text type="secondary">Роль: {ROLE_LABELS[user.role]}</Text>
              {user.mark ? <Text type="secondary">Заметка: {user.mark}</Text> : null}
              {user.sub_url ? (
                <Link href={user.sub_url} target="_blank">
                  <Flex align="center" gap={6}>
                    <LinkOutlined />
                    <span>Ссылка подписки</span>
                  </Flex>
                </Link>
              ) : null}
            </Space>
          </Card>

          {xuiLoading ? (
            <Card size="small">
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <Spin />
              </div>
            </Card>
          ) : xuiClient ? (
            <XuiClientCard client={xuiClient} variant="profile" />
          ) : (
            <Card size="small">
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={xuiError ?? "XUI-клиент не найден"} />
            </Card>
          )}

          <Card
            size="small"
            title={
              <Flex align="center" gap={8}>
                <ThemedIconAvatar shape="square" size="small" icon={<FileOutlined />} />
                <span>Счета</span>
              </Flex>
            }
          >
            <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
              {invoicesError ? <Text type="danger">{invoicesError}</Text> : null}

              <AsyncListState loading={invoicesLoading} empty={!invoices.items.length} emptyDescription="Счетов нет" minHeight={64}>
                {invoices.items.map((item) => (
                  <InvoiceCard key={item.id} item={item} variant="profile" />
                ))}
              </AsyncListState>

              <PaginationFooter
                page={invoices.page}
                pages={invoices.pages}
                total={invoices.total}
                loading={invoicesLoading}
                onPageChange={(page) => void loadInvoices(page, user.id)}
              />
            </Space>
          </Card>
        </Space>
      ) : (
        <Text type="secondary">Пользователь не выбран</Text>
      )}
    </Modal>
  );
}
