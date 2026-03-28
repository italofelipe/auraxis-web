import { ref, computed, readonly } from "vue";
import type { UsePaginationReturn } from "./usePagination.types";

/**
 * Composable for managing server-side pagination state.
 *
 * Tracks the current page, page size and total item count. Exposes
 * helpers for navigating between pages and updating the total after
 * an API response arrives.
 *
 * @param initialLimit - Items per page. Defaults to 20.
 * @returns Reactive pagination state and navigation helpers.
 *
 * @example
 * ```ts
 * const { page, limit, total, setTotal, nextPage } = usePagination(10);
 * const { data } = useQuery(['goals', page, limit], () => fetchGoals({ page: page.value, limit: limit.value }));
 * watch(data, (d) => { if (d) setTotal(d.meta.total); });
 * ```
 */
export function usePagination(initialLimit = 20): UsePaginationReturn {
  const page = ref(1);
  const limit = ref(initialLimit);
  const total = ref(0);

  const totalPages = computed(() =>
    total.value === 0 ? 1 : Math.ceil(total.value / limit.value),
  );

  const hasPrevPage = computed(() => page.value > 1);
  const hasNextPage = computed(() => page.value < totalPages.value);

  /**
   * Navigates to the given page number, clamped between 1 and totalPages.
   * @param target - Desired page number.
   */
  function goToPage(target: number): void {
    const clamped = Math.max(1, Math.min(target, totalPages.value));
    page.value = clamped;
  }

  /** Advances to the next page if one exists. */
  function nextPage(): void {
    if (hasNextPage.value) {
      page.value += 1;
    }
  }

  /** Goes back to the previous page if one exists. */
  function prevPage(): void {
    if (hasPrevPage.value) {
      page.value -= 1;
    }
  }

  /**
   * Updates the total item count (call after receiving the API response).
   * @param t - Total number of items.
   */
  function setTotal(t: number): void {
    total.value = t;
  }

  /** Resets page to 1 and total to 0. */
  function reset(): void {
    page.value = 1;
    total.value = 0;
  }

  return {
    page: readonly(page),
    limit: readonly(limit),
    total: readonly(total),
    totalPages,
    hasPrevPage,
    hasNextPage,
    goToPage,
    nextPage,
    prevPage,
    setTotal,
    reset,
  };
}
