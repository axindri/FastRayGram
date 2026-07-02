import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

type PaginationFooterProps = {
  page: number;
  pages: number;
  total: number;
  loading: boolean;
  onPageChange: (page: number) => void;
};

function paginationControlClassName(disabled: boolean) {
  return cn(disabled && "pointer-events-none opacity-50");
}

export function PaginationFooter({ page, pages, total, loading, onPageChange }: PaginationFooterProps) {
  if (total <= 0 || pages <= 1) {
    return null;
  }

  const prevDisabled = page <= 1 || loading;
  const nextDisabled = page >= pages || loading;

  return (
    <Pagination className="mx-0 w-full shrink-0 justify-center">
      <PaginationContent className="shrink-0">
        <PaginationItem>
          <PaginationPrevious
            href="#"
            className={paginationControlClassName(prevDisabled)}
            aria-disabled={prevDisabled}
            tabIndex={prevDisabled ? -1 : undefined}
            onClick={(event) => {
              event.preventDefault();
              if (!prevDisabled) {
                onPageChange(page - 1);
              }
            }}
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive className="pointer-events-none" onClick={(event) => event.preventDefault()}>
            {page}
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            href="#"
            className={paginationControlClassName(nextDisabled)}
            aria-disabled={nextDisabled}
            tabIndex={nextDisabled ? -1 : undefined}
            onClick={(event) => {
              event.preventDefault();
              if (!nextDisabled) {
                onPageChange(page + 1);
              }
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
