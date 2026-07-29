import { computed, ref, type VNode } from "vue";
import { describe, expect, it, vi } from "vitest";
import { NEllipsis } from "naive-ui";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";
import {
  darkenHex,
  formatTransactionDate,
  buildPaidStatusFeedback,
  isTransactionNearDue,
  isTransactionOverdue,
  renderNotes,
  renderTagBadge,
  renderTitle,
  resolveSwipeGestureAction,
  useTransactionTable,
} from "../useTransactionTable";
import type { TagLookup } from "../useTransactionFilters";

/**
 * Reads the text a VNode passes through its default slot.
 *
 * @param vnode - VNode whose children are slot functions.
 * @returns The rendered default-slot content.
 */
function readDefaultSlot(vnode: VNode): unknown {
  const slots = vnode.children as { default?: () => unknown } | null;
  return slots?.default?.();
}

vi.mock("vue-i18n", () => ({
  useI18n: (): { t: (key: string, ctx?: Record<string, unknown>) => string } => ({
    t: (key: string, ctx?: Record<string, unknown>) =>
      ctx && "n" in ctx ? `${key}:${String(ctx.n)}` : key,
  }),
}));

describe("formatTransactionDate", () => {
  it("formats YYYY-MM-DD as dd/MM/yyyy", () => {
    expect(formatTransactionDate("2026-03-07")).toBe("07/03/2026");
  });

  it("pads single-digit day and month", () => {
    expect(formatTransactionDate("2026-01-05")).toBe("05/01/2026");
  });
});

describe("isTransactionOverdue", () => {
  it("returns false for paid transactions regardless of due date", () => {
    expect(isTransactionOverdue("2020-01-01", "paid")).toBe(false);
  });

  it("returns true for past due date with pending status", () => {
    expect(isTransactionOverdue("2020-01-01", "pending")).toBe(true);
  });

  it("returns false for future due date with pending status", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const isoDate = future.toISOString().slice(0, 10);
    expect(isTransactionOverdue(isoDate, "pending")).toBe(false);
  });
});

describe("isTransactionNearDue", () => {
  it("returns false for paid transactions", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isTransactionNearDue(tomorrow.toISOString().slice(0, 10), "paid")).toBe(false);
  });

  it("returns true for unpaid transaction due within 7 days", () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 3);
    expect(isTransactionNearDue(soon.toISOString().slice(0, 10), "pending")).toBe(true);
  });

  it("returns false for unpaid transaction due in 8+ days", () => {
    const far = new Date();
    far.setDate(far.getDate() + 10);
    expect(isTransactionNearDue(far.toISOString().slice(0, 10), "pending")).toBe(false);
  });

  it("returns false for overdue (past) transactions", () => {
    expect(isTransactionNearDue("2020-01-01", "pending")).toBe(false);
  });
});

describe("darkenHex", () => {
  it("returns pure black when factor is 1", () => {
    expect(darkenHex("#FF6B6B", 1)).toBe("#000000");
  });

  it("returns original colour when factor is 0", () => {
    expect(darkenHex("#ff6b6b", 0)).toBe("#ff6b6b");
  });

  it("darkens each channel by the factor (mix with black)", () => {
    // 0xFF (255) * (1 - 0.5) = 127.5 → rounds to 128 → 0x80
    expect(darkenHex("#FF6B6B", 0.5)).toBe("#803636");
  });

  it("pads single-hex-digit channels to two characters", () => {
    // 0x11 * 0.5 = 8.5 → rounds to 9 → must be "09", not "9"
    expect(darkenHex("#111111", 0.5)).toBe("#090909");
  });
});

describe("renderTagBadge", () => {
  /**
   * Builds a minimal transaction fixture for tag-badge tests.
   *
   * @param tagId - Optional tag id to assign to the row.
   * @returns A TransactionDto with the given tag id.
   */
  function buildTx(tagId: string | null): TransactionDto {
    return {
      id: "tx-1",
      title: "Payment",
      amount: "10.00",
      type: "expense",
      status: "pending",
      due_date: "2026-01-01",
      tag_id: tagId,
    } as unknown as TransactionDto;
  }

  it("returns em-dash placeholder when tag is not in the map", () => {
    const map = computed(() => new Map<string, TagLookup>());
    expect(renderTagBadge(buildTx(null), map)).toBe("—");
  });

  it("returns plain tag name when tag exists but has no colour", () => {
    const map = computed(() => new Map<string, TagLookup>([["t1", { name: "Food", color: null }]]));
    expect(renderTagBadge(buildTx("t1"), map)).toBe("Food");
  });

  it("returns a styled VNode when tag has a colour", () => {
    const map = computed(() => new Map<string, TagLookup>([["t1", { name: "Urgent", color: "#FF6B6B" }]]));
    const result = renderTagBadge(buildTx("t1"), map);
    expect(typeof result).toBe("object");
    // VNode children contain the tag name
    expect(JSON.stringify(result)).toContain("Urgent");
    // Style string includes the background colour + 20 alpha suffix
    expect(JSON.stringify(result)).toContain("#FF6B6B20");
  });
});

describe("renderNotes", () => {
  /**
   * Builds a minimal transaction fixture for notes-cell tests.
   *
   * @param description - Free-text observation ("Observações") field value.
   * @returns A TransactionDto with the given description.
   */
  function buildTx(description: string | null): TransactionDto {
    return {
      id: "tx-1",
      title: "Payment",
      amount: "10.00",
      type: "expense",
      status: "pending",
      due_date: "2026-01-01",
      description,
    } as unknown as TransactionDto;
  }

  it("returns em-dash placeholder when there is no observation", () => {
    expect(renderNotes(buildTx(null))).toBe("—");
  });

  it("returns em-dash placeholder when the observation is blank whitespace", () => {
    expect(renderNotes(buildTx("   "))).toBe("—");
  });

  it("clamps the note to two lines and defers the full text to a tooltip", () => {
    const text = "Pagar antes do dia 10 — combinado com o financeiro";
    const result = renderNotes(buildTx(text)) as VNode;

    expect(result.type).toBe(NEllipsis);
    expect(result.props?.lineClamp).toBe(2);
    expect(result.props?.tooltip).toBe(true);
    expect(readDefaultSlot(result)).toBe(text);
  });

  it("trims surrounding whitespace before rendering", () => {
    const result = renderNotes(buildTx("  nota com espaços  ")) as VNode;

    expect(readDefaultSlot(result)).toBe("nota com espaços");
  });
});

describe("renderTitle", () => {
  /**
   * Identity translator so assertions can match on raw i18n keys.
   *
   * @param key - Translation key.
   * @returns The key itself.
   */
  const t = (key: string): string => key;
  const billCtx = { selectedMonth: null, periodMode: "month" as const };

  /**
   * Builds a minimal transaction fixture for title-cell tests.
   *
   * @param overrides - Transaction fields to override.
   * @returns A TransactionDto with the given overrides.
   */
  function buildTx(overrides: Partial<TransactionDto> = {}): TransactionDto {
    return {
      id: "tx-1",
      title: "Fatura do cartão Nubank Ultravioleta",
      amount: "10.00",
      type: "expense",
      status: "pending",
      due_date: "2026-01-01",
      description: null,
      ...overrides,
    } as unknown as TransactionDto;
  }

  /**
   * Walks a VNode tree collecting every node of the given component type.
   *
   * @param node - Root VNode to search.
   * @param type - Component definition to match against.
   * @returns Every matching descendant, in traversal order.
   */
  function findAll(node: unknown, type: unknown): VNode[] {
    if (!node || typeof node !== "object") { return []; }
    if (Array.isArray(node)) { return node.flatMap((child) => findAll(child, type)); }

    const vnode = node as VNode;
    const here = vnode.type === type ? [vnode] : [];
    return [...here, ...findAll(vnode.children, type)];
  }

  it("wraps the transaction name so it truncates and shows a tooltip", () => {
    const [name] = findAll(renderTitle(buildTx(), t, billCtx), NEllipsis);

    expect(name).toBeDefined();
    expect(name?.props?.tooltip).toBe(true);
    expect(readDefaultSlot(name as VNode)).toBe("Fatura do cartão Nubank Ultravioleta");
  });

  it("keeps the recurring badge outside the truncated name", () => {
    const cell = renderTitle(buildTx({ is_recurring: true } as Partial<TransactionDto>), t, billCtx);
    const [name] = findAll(cell, NEllipsis);

    // The badge must not be swallowed by the ellipsis, or it would count as
    // overflow and force a tooltip on names that fit perfectly well.
    expect(readDefaultSlot(name as VNode)).toBe("Fatura do cartão Nubank Ultravioleta");
    expect(JSON.stringify(cell)).toContain("transactions.recurring");
  });
});

describe("buildPaidStatusFeedback", () => {
  /**
   * Builds a minimal transaction fixture for paid-feedback tests.
   *
   * @param overrides Transaction fields to override.
   * @returns Transaction DTO fixture.
   */
  function buildTx(overrides: Partial<TransactionDto> = {}): TransactionDto {
    return {
      id: "tx-paid-1",
      title: "IPTU",
      amount: "2580.00",
      type: "expense",
      status: "paid",
      due_date: "2026-05-11",
      paid_at: "2026-05-10T00:00:00.000-03:00",
      tag_id: null,
      ...overrides,
    } as unknown as TransactionDto;
  }

  it("returns Pago with payment date for paid expenses", () => {
    expect(buildPaidStatusFeedback(buildTx())).toEqual({
      label: "Pago",
      title: "Pago em 10/05/2026",
    });
  });

  it("returns Recebido with receipt date for paid income", () => {
    expect(buildPaidStatusFeedback(buildTx({ type: "income" }))).toEqual({
      label: "Recebido",
      title: "Recebido em 10/05/2026",
    });
  });

  it("returns null for pending transactions", () => {
    expect(buildPaidStatusFeedback(buildTx({ status: "pending", paid_at: null }))).toBeNull();
  });
});

describe("resolveSwipeGestureAction", () => {
  it("ignores mostly vertical scroll gestures even with horizontal drift", () => {
    expect(resolveSwipeGestureAction(-96, 240)).toBeNull();
  });

  it("returns delete only for intentional left horizontal swipes", () => {
    expect(resolveSwipeGestureAction(-96, 18)).toBe("delete");
  });

  it("returns mark-paid only for intentional right horizontal swipes", () => {
    expect(resolveSwipeGestureAction(96, 18)).toBe("mark-paid");
  });
});

describe("useTransactionTable", () => {
  /**
   * Builds a table transaction fixture.
   *
   * @param overrides Transaction fields to override.
   * @returns Transaction DTO fixture.
   */
  function buildTx(overrides: Partial<TransactionDto> = {}): TransactionDto {
    return {
      id: "tx-fixture",
      title: "Transaction",
      amount: "100.00",
      type: "expense",
      status: "pending",
      due_date: "2026-05-10",
      tag_id: null,
      account_id: null,
      ...overrides,
    } as unknown as TransactionDto;
  }

  it("keeps totals finite for formatted and malformed monetary values", () => {
    const data = ref<TransactionDto[]>([
      buildTx({ id: "income-brl", type: "income", amount: "R$ 1.234,56" }),
      buildTx({ id: "income-invalid", type: "income", amount: "NaN" }),
      buildTx({ id: "expense-decimal", type: "expense", amount: "234.56" }),
      buildTx({ id: "expense-invalid", type: "expense", amount: "Infinity" }),
    ]);

    const table = useTransactionTable({
      data,
      tagMap: computed(() => new Map()),
      tagDetailMap: computed(() => new Map()),
      accountMap: computed(() => new Map()),
      filterType: ref("all"),
      filterStatus: ref("all"),
      filterStartDate: ref(null),
      filterEndDate: ref(null),
      filterTagId: ref("all"),
      periodMode: computed(() => "month" as const),
      deleteMutation: { isPending: ref(false) },
      markPaidMutation: { isPending: ref(false) },
      duplicateMutation: { isPending: ref(false) },
      deleteTarget: ref(null),
      onEdit: vi.fn(),
      onMarkPaid: vi.fn(),
      onDelete: vi.fn(),
      onDuplicate: vi.fn(),
    });

    expect(table.totalIncome.value).toBeCloseTo(1234.56);
    expect(table.totalExpense.value).toBeCloseTo(234.56);
    expect(Number.isFinite(table.totalIncome.value)).toBe(true);
    expect(Number.isFinite(table.totalExpense.value)).toBe(true);
  });

  it("gives the description column a width floor and no column-level ellipsis", () => {
    const table = useTransactionTable({
      data: ref<TransactionDto[]>([buildTx()]),
      tagMap: computed(() => new Map()),
      tagDetailMap: computed(() => new Map()),
      accountMap: computed(() => new Map()),
      filterType: ref("all"),
      filterStatus: ref("all"),
      filterStartDate: ref(null),
      filterEndDate: ref(null),
      filterTagId: ref("all"),
      periodMode: computed(() => "month" as const),
      deleteMutation: { isPending: ref(false) },
      markPaidMutation: { isPending: ref(false) },
      duplicateMutation: { isPending: ref(false) },
      deleteTarget: ref(null),
      onEdit: vi.fn(),
      onMarkPaid: vi.fn(),
      onDelete: vi.fn(),
      onDuplicate: vi.fn(),
    });

    const description = table.columns.value.find(
      (column) => (column as { key?: string }).key === "title",
    ) as { minWidth?: number; width?: number; ellipsis?: unknown } | undefined;

    // It is the only column without a fixed width, so it absorbs the leftover
    // space — which collapses to ~60px and clips the header to "D…" unless a
    // floor holds it open.
    expect(description?.minWidth).toBeGreaterThanOrEqual(200);
    // Column-level ellipsis wraps the header too, and cannot measure the
    // cell's block-level content anyway — the tooltip lives on the name instead.
    expect(description?.ellipsis).toBeUndefined();
  });
});
