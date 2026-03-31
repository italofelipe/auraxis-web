import type { Meta, StoryObj } from "@storybook/vue3";
import PlanCard from "./PlanCard.vue";
import type { PlanDto } from "~/features/subscription/contracts/subscription.dto";

const meta: Meta<typeof PlanCard> = {
  title: "Features/Subscription/PlanCard",
  component: PlanCard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Card displaying a subscription plan with features list, pricing, and a subscribe CTA button. Highlights the current plan. Supports monthly and annual billing cycles.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof PlanCard>;

const freePlan: PlanDto = {
  slug: "free",
  name: "Gratuito",
  price_monthly: 0,
  price_annual: 0,
  features: [
    { label: "Até 50 transações/mês", included: true },
    { label: "1 meta financeira", included: true },
    { label: "Relatórios básicos", included: true },
    { label: "Simulações financeiras", included: false },
    { label: "Lançamentos compartilhados", included: false },
    { label: "Suporte prioritário", included: false },
  ],
};

const proPlan: PlanDto = {
  slug: "premium",
  name: "Pro",
  price_monthly: 29.9,
  price_annual: 24.9,
  features: [
    { label: "Transações ilimitadas", included: true },
    { label: "Metas ilimitadas", included: true },
    { label: "Relatórios avançados", included: true },
    { label: "Simulações financeiras", included: true },
    { label: "Lançamentos compartilhados", included: true },
    { label: "Suporte prioritário", included: true },
  ],
};

export const FreePlan: Story = {
  name: "Free Plan",
  args: {
    plan: freePlan,
    isCurrent: false,
    billingCycle: "monthly",
  },
};

export const FreePlanCurrent: Story = {
  name: "Free Plan — Current",
  args: {
    plan: freePlan,
    isCurrent: true,
    billingCycle: "monthly",
  },
};

export const ProPlanMonthly: Story = {
  name: "Pro Plan — Monthly",
  args: {
    plan: proPlan,
    isCurrent: false,
    billingCycle: "monthly",
  },
};

export const ProPlanAnnual: Story = {
  name: "Pro Plan — Annual",
  args: {
    plan: proPlan,
    isCurrent: false,
    billingCycle: "annual",
  },
};

export const ProPlanCurrent: Story = {
  name: "Pro Plan — Current",
  args: {
    plan: proPlan,
    isCurrent: true,
    billingCycle: "monthly",
  },
};

export const Loading: Story = {
  name: "Loading",
  args: {
    plan: proPlan,
    isCurrent: false,
    loading: true,
  },
};
