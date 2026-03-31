import type { SubscriptionDto, PlanDto } from "../contracts/subscription.dto";

const periodEnd = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString();

/**
 * Mock of the current user's active subscription (Premium plan, monthly billing).
 */
export const MOCK_CURRENT_SUBSCRIPTION: SubscriptionDto = {
  status: "active",
  plan: {
    slug: "premium",
    name: "Premium",
    price_monthly: 39.9,
    price_annual: 29.9,
    features: [
      { label: "Transações ilimitadas", included: true },
      { label: "Metas ilimitadas", included: true },
      { label: "Relatórios avançados", included: true },
      { label: "Simulações financeiras", included: true },
      { label: "Lançamentos compartilhados", included: true },
      { label: "Suporte prioritário", included: true },
    ],
  },
  current_period_end: periodEnd,
  cancel_at_period_end: false,
};

/**
 * Mock of all available plans with features and BRL pricing.
 *
 * Canonical pricing (2026):
 *   Free:    R$0
 *   Premium: R$39,90/mês ou R$358,80/ano (R$29,90/mês)
 */
export const MOCK_ALL_PLANS: PlanDto[] = [
  {
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
  },
  {
    slug: "premium",
    name: "Premium",
    price_monthly: 39.9,
    price_annual: 29.9,
    features: [
      { label: "Transações ilimitadas", included: true },
      { label: "Metas ilimitadas", included: true },
      { label: "Relatórios avançados", included: true },
      { label: "Simulações financeiras", included: true },
      { label: "Lançamentos compartilhados", included: true },
      { label: "Suporte prioritário", included: true },
    ],
  },
];
