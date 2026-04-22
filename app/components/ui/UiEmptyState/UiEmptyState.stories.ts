import type { Meta, StoryObj } from "@storybook/vue3";
import type { Component } from "vue";
import type { UiEmptyStateProps } from "./UiEmptyState.types";
import { Inbox } from "lucide-vue-next";
import UiEmptyState from "./UiEmptyState.vue";
import IllustrationEmptyTransactions from "~/components/ui/illustrations/IllustrationEmptyTransactions.vue";
import IllustrationEmptyGoals from "~/components/ui/illustrations/IllustrationEmptyGoals.vue";

const meta: Meta<typeof UiEmptyState> = {
  title: "Design System/UiEmptyState",
  component: UiEmptyState,
  tags: ["autodocs"],
  argTypes: {
    title: { control: "text" },
    description: { control: "text" },
    actionLabel: { control: "text" },
  },
};

export default meta;

type Story = StoryObj<typeof UiEmptyState>;

export const Default: Story = {
  args: {
    title: "Nenhum item encontrado",
    description: "Adicione itens para visualizá-los aqui.",
    actionLabel: "Adicionar item",
  },
  render: (args) => ({
    components: { UiEmptyState },
    setup(): { args: UiEmptyStateProps; Inbox: Component } { return { args, Inbox }; },
    template: "<UiEmptyState v-bind=\"args\" :icon=\"Inbox\" />",
  }),
};

export const WithoutDescription: Story = {
  args: {
    title: "Lista vazia",
    actionLabel: "Criar novo",
  },
  render: (args) => ({
    components: { UiEmptyState },
    setup(): { args: UiEmptyStateProps } { return { args }; },
    template: "<UiEmptyState v-bind=\"args\" />",
  }),
};

export const WithoutAction: Story = {
  args: {
    title: "Sem transações",
    description: "Nenhuma transação registrada neste período.",
  },
  render: (args) => ({
    components: { UiEmptyState },
    setup(): { args: UiEmptyStateProps; Inbox: Component } { return { args, Inbox }; },
    template: "<UiEmptyState v-bind=\"args\" :icon=\"Inbox\" />",
  }),
};

export const TitleOnly: Story = {
  args: {
    title: "Sem dados",
  },
  render: (args) => ({
    components: { UiEmptyState },
    setup(): { args: UiEmptyStateProps } { return { args }; },
    template: "<UiEmptyState v-bind=\"args\" />",
  }),
};

export const WithIllustration: Story = {
  name: "With illustration (transactions)",
  args: {
    title: "Nenhuma transação registrada",
    description: "Adicione receitas ou despesas para começar a acompanhar suas finanças.",
    actionLabel: "Adicionar transação",
  },
  render: (args) => ({
    components: { UiEmptyState, IllustrationEmptyTransactions },
    setup(): { args: UiEmptyStateProps } { return { args }; },
    template: "<UiEmptyState v-bind=\"args\"><template #illustration><IllustrationEmptyTransactions style=\"max-width:160px\" /></template></UiEmptyState>",
  }),
};

export const WithIllustrationGoals: Story = {
  name: "With illustration (goals)",
  args: {
    title: "Nenhuma meta criada",
    description: "Defina objetivos financeiros para acompanhar seu progresso.",
    actionLabel: "Criar meta",
  },
  render: (args) => ({
    components: { UiEmptyState, IllustrationEmptyGoals },
    setup(): { args: UiEmptyStateProps } { return { args }; },
    template: "<UiEmptyState v-bind=\"args\"><template #illustration><IllustrationEmptyGoals style=\"max-width:160px\" /></template></UiEmptyState>",
  }),
};
