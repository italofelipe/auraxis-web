import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from "vue";

import type { GoalDto } from "~/features/goals/contracts/goal.dto";

export const NET_WORTH_SCENARIOS = [
  {
    id: "optimistic",
    label: "Otimista",
    annualRate: 0.1575,
    description: "CDI x 1,5",
  },
  {
    id: "base",
    label: "Base",
    annualRate: 0.105,
    description: "CDI",
  },
  {
    id: "pessimistic",
    label: "Pessimista",
    annualRate: 0.045,
    description: "Inflação",
  },
] as const;

export type NetWorthScenarioId = (typeof NET_WORTH_SCENARIOS)[number]["id"];
export type NetWorthHorizon = 12 | 24 | 60;

export interface NetWorthProjectionInput {
  readonly anchorDate: string;
  readonly currentNetWorth: number;
  readonly investedAmount: number;
  readonly horizonMonths: NetWorthHorizon;
  readonly monthlyContribution: number;
  readonly goals?: readonly GoalDto[];
}

export interface NetWorthProjectionPoint {
  readonly monthOffset: number;
  readonly label: string;
  readonly value: number;
  readonly date: string;
}

export interface NetWorthGoalMarker {
  readonly goalId: string;
  readonly label: string;
  readonly monthOffset: number;
  readonly targetAmount: number;
  readonly value: number;
}

export interface NetWorthProjectionResult {
  readonly actualSeries: readonly NetWorthProjectionPoint[];
  readonly projectedSeries: Readonly<Record<NetWorthScenarioId, readonly NetWorthProjectionPoint[]>>;
  readonly scenarios: typeof NET_WORTH_SCENARIOS;
  readonly finalValues: Readonly<Record<NetWorthScenarioId, number>>;
  readonly goalMarkers: readonly NetWorthGoalMarker[];
}

/**
 * Builds historical and projected patrimony series for the portfolio timeline.
 *
 * @param input Projection inputs.
 * @returns Chart-ready projection data.
 */
export function buildNetWorthProjection(input: NetWorthProjectionInput): NetWorthProjectionResult {
  const anchor = parseMonth(input.anchorDate);
  const currentNetWorth = Math.max(0, input.currentNetWorth);
  const investedAmount = Math.max(0, input.investedAmount);
  const monthlyContribution = Math.max(0, input.monthlyContribution);

  const actualSeries = Array.from({ length: 13 }, (_, index): NetWorthProjectionPoint => {
    const monthOffset = index - 12;
    const progress = index / 12;
    const seasonalSwing = Math.sin(index * 0.85) * currentNetWorth * 0.006;
    const value = roundCurrency(investedAmount + (currentNetWorth - investedAmount) * progress + seasonalSwing);

    return {
      monthOffset,
      label: formatMonthLabel(addMonths(anchor, monthOffset)),
      value: index === 12 ? roundCurrency(currentNetWorth) : Math.max(0, value),
      date: formatDate(addMonths(anchor, monthOffset)),
    };
  });

  const projectedSeries: Record<NetWorthScenarioId, readonly NetWorthProjectionPoint[]> = {
    optimistic: [],
    base: [],
    pessimistic: [],
  };

  for (const scenario of NET_WORTH_SCENARIOS) {
    const monthlyRate = Math.pow(1 + scenario.annualRate, 1 / 12) - 1;
    let value = currentNetWorth;

    projectedSeries[scenario.id] = Array.from({ length: input.horizonMonths + 1 }, (_, monthOffset): NetWorthProjectionPoint => {
      if (monthOffset > 0) {
        value = value * (1 + monthlyRate) + monthlyContribution;
      }

      return {
        monthOffset,
        label: formatMonthLabel(addMonths(anchor, monthOffset)),
        value: roundCurrency(value),
        date: formatDate(addMonths(anchor, monthOffset)),
      };
    });
  }

  const finalValues = Object.fromEntries(
    NET_WORTH_SCENARIOS.map((scenario) => [
      scenario.id,
      projectedSeries[scenario.id][input.horizonMonths]?.value ?? currentNetWorth,
    ]),
  ) as Record<NetWorthScenarioId, number>;

  const goalMarkers = (input.goals ?? [])
    .filter((goal) => goal.status === "active" || goal.status === "paused")
    .map((goal): NetWorthGoalMarker | null => {
      const monthOffset = monthDifference(anchor, parseMonth(goal.target_date));

      if (monthOffset < 0 || monthOffset > input.horizonMonths) {
        return null;
      }

      return {
        goalId: goal.id,
        label: goal.name,
        monthOffset,
        targetAmount: goal.target_amount,
        value: projectedSeries.base[monthOffset]?.value ?? goal.target_amount,
      };
    })
    .filter((marker): marker is NetWorthGoalMarker => marker !== null);

  return {
    actualSeries,
    projectedSeries,
    scenarios: NET_WORTH_SCENARIOS,
    finalValues,
    goalMarkers,
  };
}

/**
 * Creates a reactive net worth projection.
 *
 * @param input Projection input ref or getter.
 * @returns Reactive projection result.
 */
export function useNetWorthProjection(
  input: MaybeRefOrGetter<NetWorthProjectionInput>,
): ComputedRef<NetWorthProjectionResult> {
  return computed(() => buildNetWorthProjection(toValue(input)));
}

/**
 * Parses a date string into a UTC month anchor.
 *
 * @param value ISO-like date string.
 * @returns UTC date at the first day of the parsed month.
 */
function parseMonth(value: string): Date {
  const [year = "1970", month = "01"] = value.split("-");
  return new Date(Date.UTC(Number(year), Number(month) - 1, 1));
}

/**
 * Adds months to a UTC month anchor.
 *
 * @param date Base date.
 * @param offset Month offset.
 * @returns Shifted UTC date.
 */
function addMonths(date: Date, offset: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1));
}

/**
 * Formats a month for chart labels.
 *
 * @param date Month date.
 * @returns Short pt-BR month label.
 */
function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  })
    .format(date)
    .replace(".", "");
}

/**
 * Formats a month date as an ISO date.
 *
 * @param date Month date.
 * @returns YYYY-MM-DD date string.
 */
function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Calculates the month distance between two month anchors.
 *
 * @param from Start month.
 * @param to End month.
 * @returns Full month difference.
 */
function monthDifference(from: Date, to: Date): number {
  return (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth());
}

/**
 * Rounds currency-like values to cents.
 *
 * @param value Raw value.
 * @returns Rounded value.
 */
function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}
