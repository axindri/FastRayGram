import type { ReactNode } from "react";

import { AsyncListState } from "@/components/AsyncListState";
import { PaginationFooter } from "@/components/PaginationFooter";

type PaginatedListProps = {
  page: number;
  pages: number;
  total: number;
  loading: boolean;
  empty: boolean;
  emptyDescription: string;
  emptyTitle?: string;
  onPageChange: (page: number) => void;
  children: ReactNode;
  minHeight?: number;
  size?: "default" | "large";
};

export function PaginatedList({
  page,
  pages,
  total,
  loading,
  empty,
  emptyDescription,
  emptyTitle,
  onPageChange,
  children,
  minHeight = 80,
  size = "default",
}: PaginatedListProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      <AsyncListState
        loading={loading}
        empty={empty}
        emptyDescription={emptyDescription}
        emptyTitle={emptyTitle}
        minHeight={minHeight}
        size={size}
      >
        {children}
      </AsyncListState>
      <PaginationFooter
        page={page}
        pages={pages}
        total={total}
        loading={loading}
        onPageChange={onPageChange}
      />
    </div>
  );
}
