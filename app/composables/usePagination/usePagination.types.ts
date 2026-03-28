import type { DeepReadonly, Ref } from "vue";

/** Return type of the usePagination composable. */
export interface UsePaginationReturn {
  /** Current page number (1-based). Readonly. */
  page: DeepReadonly<Ref<number>>;
  /** Number of items per page. Readonly. */
  limit: DeepReadonly<Ref<number>>;
  /** Total number of items (as reported by the API). Readonly. */
  total: DeepReadonly<Ref<number>>;
  /** Total number of pages derived from total and limit. */
  totalPages: Ref<number>;
  /** Whether there is a previous page available. */
  hasPrevPage: Ref<boolean>;
  /** Whether there is a next page available. */
  hasNextPage: Ref<boolean>;
  /** Navigate to an arbitrary page number (clamped to valid range). */
  goToPage: (page: number) => void;
  /** Navigate to the next page if one exists. */
  nextPage: () => void;
  /** Navigate to the previous page if one exists. */
  prevPage: () => void;
  /** Update the total item count (typically called after receiving API response). */
  setTotal: (total: number) => void;
  /** Reset page to 1 and total to 0. */
  reset: () => void;
}
