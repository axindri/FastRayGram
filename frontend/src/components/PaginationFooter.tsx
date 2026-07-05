import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationFooterProps = {
  page: number;
  pages: number;
  total: number;
  loading: boolean;
  entity: string;
  onPageChange: (page: number) => void;
};

const navButtonClassName =
  "flex size-9 shrink-0 items-center justify-center rounded-md border bg-card text-sm shadow-xs transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40";

export function PaginationFooter({ page, pages, total, loading, entity, onPageChange }: PaginationFooterProps) {
  if (total <= 0 || pages <= 1) {
    return null;
  }

  const prevDisabled = page <= 1 || loading;
  const nextDisabled = page >= pages || loading;

  return (
    <nav aria-label="Пагинация" className="flex w-full flex-wrap items-center justify-center gap-3 pt-2">
      <button type="button" aria-label="Предыдущая страница" disabled={prevDisabled} className={navButtonClassName} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft className="size-4" aria-hidden />
      </button>
      <span aria-live="polite" className="text-center text-sm tabular-nums text-muted-foreground">
        Страница <span className="text-foreground">{page}</span> из <span className="text-foreground">{pages}</span>
        {" · "}
        <span className="text-foreground">
          {total} {entity}
        </span>
      </span>
      <button type="button" aria-label="Следующая страница" disabled={nextDisabled} className={navButtonClassName} onClick={() => onPageChange(page + 1)}>
        <ChevronRight className="size-4" aria-hidden />
      </button>
    </nav>
  );
}
