import type { Meta, StoryObj } from "@storybook/vue3";

import { buildStatement } from "../model/credit-card-statement";
import FaturasView from "./FaturasView.vue";
import { STORY_CARDS, STORY_TAGS, STORY_TXS } from "./cc-story-fixtures";

const consolidated = buildStatement({
  transactions: STORY_TXS, tags: STORY_TAGS, cards: STORY_CARDS, month: "2026-06", cardId: null,
});
const single = buildStatement({
  transactions: STORY_TXS, tags: STORY_TAGS, cards: STORY_CARDS, month: "2026-06", cardId: "inter",
});

const meta: Meta<typeof FaturasView> = {
  title: "Cartões/FaturasView",
  component: FaturasView,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof FaturasView>;

export const Consolidado: Story = {
  render: () => ({
    components: { FaturasView },
    setup(): { statement: typeof consolidated; cards: typeof STORY_CARDS } {
      return { statement: consolidated, cards: STORY_CARDS };
    },
    template: "<FaturasView :statement=\"statement\" :cards=\"cards\" :selected-card-id=\"null\" />",
  }),
};

export const CartaoUnico: Story = {
  render: () => ({
    components: { FaturasView },
    setup(): { statement: typeof single; cards: typeof STORY_CARDS } {
      return { statement: single, cards: STORY_CARDS };
    },
    template: "<FaturasView :statement=\"statement\" :cards=\"cards\" selected-card-id=\"inter\" single-card />",
  }),
};
