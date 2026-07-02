import type { Paginated } from "@/types";

export function emptyPaginated<T>(limit = 4): Paginated<T> {
  return {
    items: [],
    total: 0,
    page: 1,
    limit,
    pages: 1,
  };
}
