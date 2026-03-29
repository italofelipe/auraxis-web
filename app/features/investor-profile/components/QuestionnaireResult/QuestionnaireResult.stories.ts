import type { Meta, StoryObj } from "@storybook/vue3";
import type { Component } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import QuestionnaireResult from "./QuestionnaireResult.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: "/", component: { template: "<div />" } }],
});

const meta: Meta<typeof QuestionnaireResult> = {
  title: "Features/InvestorProfile/QuestionnaireResult",
  component: QuestionnaireResult,
  tags: ["autodocs"],
  decorators: [
    (story: Component): { components: { story: Component }; template: string } => ({
      components: { story },
      template: "<story />",
    }),
  ],
  parameters: {
    docs: {
      story: {
        inline: true,
      },
    },
  },
};

export default meta;

void router;

type Story = StoryObj<typeof QuestionnaireResult>;

export const Conservador: Story = {
  args: {
    result: { suggested_profile: "conservador", score: 5 },
  },
};

export const Explorador: Story = {
  args: {
    result: { suggested_profile: "explorador", score: 9 },
  },
};

export const Entusiasta: Story = {
  args: {
    result: { suggested_profile: "entusiasta", score: 13 },
  },
};
