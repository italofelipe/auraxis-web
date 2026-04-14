import { computed, ref, type ComputedRef } from "vue";
import {
  useRecurrenceDetection,
  type RecurrencePattern,
} from "./useRecurrenceDetection";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";

const NEVER_KEY = "auraxis:recurrence:never";

/**
 * Reads permanently dismissed recurrence keys from localStorage.
 *
 * @returns Set of group keys the user has permanently dismissed.
 */
function loadNeverKeys(): Set<string> {
  try {
    const raw = localStorage.getItem(NEVER_KEY);
    return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set<string>();
  }
}

export type UseTransactionRecurrenceReturn = {
  visiblePatterns: ComputedRef<RecurrencePattern[]>;
  handleRecurrenceDismiss: (groupKey: string) => void;
  handleRecurrenceNever: (groupKey: string) => void;
  handleRecurrenceConfirm: (pattern: RecurrencePattern) => void;
};

/**
 * Manages recurrence pattern detection and suggestion dismissal.
 *
 * Reads/writes to localStorage to persist permanently dismissed patterns
 * across sessions.
 *
 * @param data - Reactive transaction list from the query.
 * @param onConfirmExpense - Called when the user confirms a recurrence pattern;
 *                           should open the expense quick-add modal.
 * @returns Visible (non-dismissed) patterns and dismissal handlers.
 */
export function useTransactionRecurrence(
  data: ComputedRef<TransactionDto[] | undefined>,
  onConfirmExpense: () => void,
): UseTransactionRecurrenceReturn {
  const neverSuggestKeys = ref<Set<string>>(loadNeverKeys());
  const sessionDismissedKeys = ref<Set<string>>(new Set());

  const allTransactions = computed(() => data.value ?? []);
  const { patterns: detectedPatterns } = useRecurrenceDetection(allTransactions);

  /**
   * Patterns still actionable (not dismissed or permanently ignored).
   *
   * @returns Filtered list of RecurrencePattern.
   */
  const visiblePatterns = computed((): RecurrencePattern[] =>
    detectedPatterns.value.filter(
      (p) => !neverSuggestKeys.value.has(p.groupKey) && !sessionDismissedKeys.value.has(p.groupKey),
    ),
  );

  /**
   * Hides a suggestion for this session only.
   *
   * @param groupKey The pattern's group key.
   */
  function handleRecurrenceDismiss(groupKey: string): void {
    sessionDismissedKeys.value = new Set([...sessionDismissedKeys.value, groupKey]);
  }

  /**
   * Permanently hides a suggestion and persists to localStorage.
   *
   * @param groupKey The pattern's group key.
   */
  function handleRecurrenceNever(groupKey: string): void {
    const next = new Set([...neverSuggestKeys.value, groupKey]);
    neverSuggestKeys.value = next;
    try {
      localStorage.setItem(NEVER_KEY, JSON.stringify([...next]));
    } catch {
      // Ignore storage errors (private mode, quota exceeded, etc.)
    }
  }

  /**
   * Opens the expense quick-add modal pre-tagged with the detected pattern,
   * dismissed from the suggestion list for this session.
   *
   * @param pattern The confirmed recurrence pattern.
   */
  function handleRecurrenceConfirm(pattern: RecurrencePattern): void {
    sessionDismissedKeys.value = new Set([...sessionDismissedKeys.value, pattern.groupKey]);
    onConfirmExpense();
  }

  return {
    visiblePatterns,
    handleRecurrenceDismiss,
    handleRecurrenceNever,
    handleRecurrenceConfirm,
  };
}
