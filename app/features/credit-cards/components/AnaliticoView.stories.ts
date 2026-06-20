import type { Meta, StoryObj } from "@storybook/vue3";

import { buildAnalytics } from "../model/credit-card-analytics";
import AnaliticoView from "./AnaliticoView.vue";
import { STORY_CARDS, STORY_TAGS, STORY_TXS } from "./cc-story-fixtures";

const consolidated = buildAnalytics({
  transactions: STORY_TXS, tags: STORY_TAGS, cards: STORY_CARDS, month: "2026-06", cardId: null,
});
const single = buildAnalytics({
  transactions: STORY_TXS, tags: STORY_TAGS, cards: STORY_CARDS, month: "2026-06", cardId: "inter",
});

const meta: Meta<typeof AnaliticoView> = {
  title: "Cartões/AnaliticoView",
  component: AnaliticoView,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof AnaliticoView>;

export const Consolidado: Story = {
  render: () => ({
    components: { AnaliticoView },
    setup(): { analytics: typeof consolidated; cards: typeof STORY_CARDS } {
      return { analytics: consolidated, cards: STORY_CARDS };
    },
    template:
      "<AnaliticoView :analytics=\"analytics\" :cards=\"cards\" :selected-card-id=\"null\" month-label=\"junho de 2026\" />",
  }),
};

export const CartaoUnico: Story = {
  render: () => ({
    components: { AnaliticoView },
    setup(): { analytics: typeof single; cards: typeof STORY_CARDS } {
      return { analytics: single, cards: STORY_CARDS };
    },
    template:
      "<AnaliticoView :analytics=\"analytics\" :cards=\"cards\" selected-card-id=\"inter\" month-label=\"junho de 2026\" single-card />",
  }),
};
