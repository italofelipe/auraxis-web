import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from "vue";

import type {
  InsightDimension,
  InsightItem,
  InsightSourceSurface,
} from "~/features/ai-insights/contracts/ai-insight";

export interface InsightDimensionGroup {
  readonly dimension: InsightDimension;
  readonly label: string;
  readonly items: InsightItem[];
}

export interface InsightSurfaceConfig {
  readonly sourceSurface: InsightSourceSurface;
  readonly dimension?: InsightDimension;
}

const DIMENSION_ORDER: readonly InsightDimension[] = [
  "general",
  "transactions",
  "credit_cards",
  "goals",
  "budgets",
  "wallet",
];

const DIMENSION_LABELS: Record<InsightDimension, string> = {
  general: "Visão geral",
  transactions: "Transações",
  credit_cards: "Cartões",
  goals: "Metas",
  budgets: "Orçamentos",
  wallet: "Carteira",
};

const ROUTE_SURFACE_CONFIG: readonly [
  prefix: string,
  config: InsightSurfaceConfig,
][] = [
  ["/transactions", { sourceSurface: "transactions", dimension: "transactions" }],
  ["/goals", { sourceSurface: "goals", dimension: "goals" }],
  ["/budgets", { sourceSurface: "budgets", dimension: "budgets" }],
  ["/credit-cards", { sourceSurface: "credit_cards", dimension: "credit_cards" }],
  ["/portfolio", { sourceSurface: "wallet", dimension: "wallet" }],
  ["/wallet", { sourceSurface: "wallet", dimension: "wallet" }],
  ["/insights", { sourceSurface: "insights" }],
];

/**
 * Returns a safe insight item with a canonical dimension.
 *
 * @param item Insight item returned by backend or legacy mocks.
 * @returns Item with dimension fallback.
 */
const normalizeDimension = (item: InsightItem): InsightItem => ({
  ...item,
  dimension: DIMENSION_ORDER.includes(item.dimension as InsightDimension)
    ? item.dimension as InsightDimension
    : "general",
});

/**
 * Returns the display label for an insight dimension.
 *
 * @param dimension Insight dimension.
 * @returns PT-BR dimension label.
 */
export const getInsightDimensionLabel = (dimension: InsightDimension): string => {
  return DIMENSION_LABELS[dimension];
};

/**
 * Maps app routes to the source surface sent to the API and the local slice
 * rendered in contextual pages.
 *
 * @param path Current route path, optionally including query/hash.
 * @returns Source surface and optional dimension filter.
 */
export const getInsightSurfaceConfig = (path: string): InsightSurfaceConfig => {
  const pathWithoutQuery = path.split("?")[0]?.split("#")[0] ?? "/";
  let normalizedPath = pathWithoutQuery || "/";
  while (normalizedPath.length > 1 && normalizedPath.endsWith("/")) {
    normalizedPath = normalizedPath.slice(0, -1);
  }
  const matched = ROUTE_SURFACE_CONFIG.find(([prefix]) =>
    normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`),
  );

  return matched?.[1] ?? { sourceSurface: "dashboard" };
};

/**
 * Filters insight items for a contextual surface. Global/general insights stay
 * available on dashboard and hub, but do not leak into feature-specific pages.
 *
 * @param items Source insight items.
 * @param dimension Contextual surface dimension.
 * @returns Items matching general or the requested dimension.
 */
export const filterInsightItemsByDimension = (
  items: readonly InsightItem[],
  dimension: InsightDimension,
): InsightItem[] => {
  return items
    .map(normalizeDimension)
    .filter((item) => item.dimension === dimension);
};

/**
 * Groups insight items for the hub in the product-defined canonical order.
 *
 * @param items Source insight items.
 * @returns Non-empty groups in canonical order.
 */
export const groupInsightItemsByDimension = (
  items: readonly InsightItem[],
): InsightDimensionGroup[] => {
  const normalized = items.map(normalizeDimension);

  return DIMENSION_ORDER
    .map((dimension) => ({
      dimension,
      label: getInsightDimensionLabel(dimension),
      items: normalized.filter((item) => item.dimension === dimension),
    }))
    .filter((group) => group.items.length > 0);
};

/**
 * Reactive adapter for pages/components that need contextual insight lists.
 *
 * @param items Source insight items ref/getter.
 * @param dimension Target dimension ref/getter.
 * @returns Computed filtered insight items.
 */
export const useInsightsByDimension = (
  items: MaybeRefOrGetter<readonly InsightItem[]>,
  dimension: MaybeRefOrGetter<InsightDimension>,
): { readonly items: ComputedRef<InsightItem[]> } => ({
  items: computed(() => filterInsightItemsByDimension(toValue(items), toValue(dimension))),
});
