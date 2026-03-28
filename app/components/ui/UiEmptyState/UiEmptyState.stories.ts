import type { Meta, StoryObj } from "@storybook/vue3";
import type { Component } from "vue";
import type { UiEmptyStateProps } from "./UiEmptyState.types";
import { Inbox } from "lucide-vue-next";
import UiEmptyState from "./UiEmptyState.vue";

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
