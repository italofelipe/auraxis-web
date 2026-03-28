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
          "Card displaying a subscription plan with features list, pricing, and a subscribe CTA button. Highlights the current plan.",
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
  features: [
    { label: "Até 50 transações/mês", included: true },
    { label: "1 meta financeira", included: true },
    { label: "Relatórios básicos", included: false },
    { label: "Simulações financeiras", included: false },
    { label: "Lançamentos compartilhados", included: false },
    { label: "Suporte prioritário", included: false },
  ],
};

const starterPlan: PlanDto = {
  slug: "starter",
  name: "Starter",
  price_monthly: 29.9,
  features: [
    { label: "Até 200 transações/mês", included: true },
    { label: "3 metas financeiras", included: true },
    { label: "Relatórios básicos", included: true },
    { label: "Simulações financeiras", included: false },
    { label: "Lançamentos compartilhados", included: false },
    { label: "Suporte prioritário", included: false },
  ],
};

export const FreePlan: Story = {
  name: "Free Plan",
  args: {
    plan: freePlan,
    isCurrent: false,
  },
};

export const StarterPlanCurrent: Story = {
  name: "Starter Plan — Current",
  args: {
    plan: starterPlan,
    isCurrent: true,
  },
};

export const ProPlan: Story = {
  name: "Pro Plan",
  args: {
    plan: {
      slug: "pro",
      name: "Pro",
      price_monthly: 59.9,
      features: [
        { label: "Transações ilimitadas", included: true },
        { label: "Metas ilimitadas", included: true },
        { label: "Relatórios avançados", included: true },
        { label: "Simulações financeiras", included: true },
        { label: "Lançamentos compartilhados", included: true },
        { label: "Suporte prioritário", included: false },
      ],
    } satisfies PlanDto,
    isCurrent: false,
  },
};

export const PremiumPlan: Story = {
  name: "Premium Plan",
  args: {
    plan: {
      slug: "premium",
      name: "Premium",
      price_monthly: 99.9,
      features: [
        { label: "Transações ilimitadas", included: true },
        { label: "Metas ilimitadas", included: true },
        { label: "Relatórios avançados", included: true },
        { label: "Simulações financeiras", included: true },
        { label: "Lançamentos compartilhados", included: true },
        { label: "Suporte prioritário", included: true },
      ],
    } satisfies PlanDto,
    isCurrent: false,
  },
};

export const Loading: Story = {
  args: {
    plan: starterPlan,
    isCurrent: false,
    loading: true,
  },
};
