import { useQueryClient } from "@tanstack/vue-query";
import type { Meta, StoryObj } from "@storybook/vue3";

import InsightsFluida from "./InsightsFluida.vue";

const meta: Meta<typeof InsightsFluida> = {
  title: "AI Insights/InsightsFluida",
  component: InsightsFluida,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Editorial reading of the AI insights. Content comes from the persisted history — never from the demo skeleton, which is Storybook-only since #1302.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof InsightsFluida>;

/** Same page size the screen uses when scanning the history. */
const HISTORY_PAGE_SIZE = 30;

const JULY_CLOSING_ID = "11111111-1111-1111-1111-111111111111";

const HISTORY = {
  items: [
    {
      id: JULY_CLOSING_ID,
      content: "",
      insight_type: "monthly",
      period_type: "monthly",
      period_label: "2026-07",
      period_start: "2026-07-01",
      period_end: "2026-07-31",
      model: "gpt-4o",
      tokens_used: 4200,
      cost_usd: 0.06,
      created_at: "2026-08-01T04:04:00Z",
    },
  ],
  page: 1,
  per_page: HISTORY_PAGE_SIZE,
  total: 1,
};

const JULY_DETAIL = {
  id: JULY_CLOSING_ID,
  summary: "Julho fechou com sobra.",
  items: [],
  // The backend's lead builder ships these; without them the mapper keeps the
  // skeleton's editorial lead, which would put a fictional headline on top of a
  // real reading.
  lead: {
    severity: "ok",
    read_min: 12,
    title: "Julho fechou no azul pelo terceiro mês seguido",
    lead: "Sobra de R$ 1.180, a maior desde março. Transporte caiu 22% e segurou o resultado.",
    next_step: "Vale mover parte da sobra para a reserva antes que ela se dilua em agosto.",
  },
  paragraphs: [
    "Julho fechou com R$ 1.180 de sobra — o terceiro mês seguido no azul, e o melhor desde março.",
    "As saídas somaram R$ 7.320 contra R$ 8.500 de entradas. Moradia e mercado responderam por 61% de tudo que saiu.",
    "O que puxou o resultado para cima foi a queda de 22% em transporte, depois que as corridas por aplicativo saíram do dia a dia.",
  ],
  retro: [
    { key: "previous_month", label: "Junho", value: 840, caption: "Sobra do mês anterior", sign: "pos" },
    { key: "average", label: "Média do semestre", value: 610, caption: "Sobra média", sign: "pos" },
  ],
  series: {
    daily: [120, 340, 90, 410, 260, 180, 300],
    weekly: [1820, 1640, 1910, 1750, 1580, 1620],
  },
};

/**
 * Builds a story that seeds the Vue Query cache so the screen renders without a
 * backend — the pattern the pr-screenshots skill prescribes.
 *
 * @param seed Callback that primes the cache.
 * @returns Story render function.
 */
const withCache = (
  seed: (qc: ReturnType<typeof useQueryClient>) => void,
): (() => Record<string, unknown>) => (): Record<string, unknown> => ({
  components: { InsightsFluida },
  setup(): Record<string, never> {
    seed(useQueryClient());
    return {};
  },
  template: "<InsightsFluida />",
});

/** The monthly closing the PO could not reach before #1302. */
export const MonthlyClosing: Story = {
  render: withCache((qc) => {
    qc.setQueryData(["ai-insights", "history", HISTORY_PAGE_SIZE], HISTORY);
    qc.setQueryData(["ai-insights", "detail", JULY_CLOSING_ID], JULY_DETAIL);
  }),
};

/** No persisted insight: an honest empty state, never the demo persona. */
export const Empty: Story = {
  render: withCache((qc) => {
    qc.setQueryData(["ai-insights", "history", HISTORY_PAGE_SIZE], {
      items: [],
      page: 1,
      per_page: HISTORY_PAGE_SIZE,
      total: 0,
    });
  }),
};
