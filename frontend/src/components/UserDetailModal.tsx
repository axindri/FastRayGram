import { useCallback, useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";

import { fetchInvoices, fetchXuiClient } from "@/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { getApiErrorMessage } from "@/utils/apiError";
import { emptyPaginated } from "@/utils/pagination";
import { INVOICES_PAGE_LIMIT, ROLE_LABELS } from "@/constants";
import type { AdminInvoice, AdminUser, Paginated, XuiClient } from "@/types";
import { CardTitleWithIcon } from "@/components/CardTitleWithIcon";
import { InvoiceCard } from "@/components/InvoiceCard";
import { PaginatedList } from "@/components/PaginatedList";
import { SubscriptionNotFound } from "@/components/SubscriptionNotFound";
import { SubscriptionLink } from "@/components/SubscriptionLink";
import { UserAvatar } from "@/components/UserAvatar";
import { XuiClientCard } from "@/components/XuiClientCard";

type UserDetailModalProps = {
  open: boolean;
  user: AdminUser | null;
  onClose: () => void;
};

export function UserDetailModal({ open, user, onClose }: UserDetailModalProps) {
  const [xuiClient, setXuiClient] = useState<XuiClient | null>(null);
  const [xuiLoading, setXuiLoading] = useState(false);
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
      setInvoicesError(null);
      setInvoices(emptyPaginated(INVOICES_PAGE_LIMIT));
      return;
    }

    let cancelled = false;
    setXuiLoading(true);
    setXuiClient(null);
    setInvoices(emptyPaginated(INVOICES_PAGE_LIMIT));

    void fetchXuiClient(user.username)
      .then((client) => {
        if (!cancelled) {
          setXuiClient(client);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setXuiClient(null);
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
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader />

        {user ? (
          <div className="flex w-full flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserAvatar username={user.username} />
                  <span>{user.username}</span>
                </CardTitle>
                <CardDescription>
                  ID {user.id} · {ROLE_LABELS[user.role]}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                {user.mark ? (
                  <p>
                    Заметка: <span className="font-semibold text-foreground">{user.mark}</span>
                  </p>
                ) : null}
                {user.sub_url ? <SubscriptionLink href={user.sub_url} /> : null}
              </CardContent>
            </Card>

            {xuiLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ) : xuiClient ? (
              <XuiClientCard client={xuiClient} access="user" />
            ) : (
              <SubscriptionNotFound />
            )}

            <Card>
              <CardHeader>
                <CardTitle>
                  <CardTitleWithIcon icon={FileText}>Счета</CardTitleWithIcon>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invoicesError ? <p className="text-sm text-destructive">{invoicesError}</p> : null}

                <PaginatedList
                  page={invoices.page}
                  pages={invoices.pages}
                  total={invoices.total}
                  loading={invoicesLoading}
                  empty={!invoices.items.length}
                  emptyDescription="Счетов нет"
                  entity="счетов"
                  minHeight={64}
                  onPageChange={(page) => void loadInvoices(page, user.id)}
                >
                  {invoices.items.map((item) => (
                    <InvoiceCard key={item.id} item={item} access="user" />
                  ))}
                </PaginatedList>
              </CardContent>
            </Card>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Пользователь не выбран</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
