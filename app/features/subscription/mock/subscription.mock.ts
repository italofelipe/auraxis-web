import type { SubscriptionDto, PlanDto } from "../contracts/subscription.dto";
import { PRICING } from "~/shared/constants/pricing";

const periodEnd = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString();

/**
 * Mock of the current user's active subscription (Premium plan, monthly billing).
 */
export const MOCK_CURRENT_SUBSCRIPTION: SubscriptionDto = {
  status: "active",
  plan: {
    slug: "premium",
    name: "Premium",
    price_monthly: PRICING.MONTHLY_PRICE,
    price_annual: PRICING.ANNUAL_MONTHLY_EQUIVALENT,
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
 *   Premium: R$27,90/mês ou R$220,00/ano (R$18,33/mês equivalente)
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
    price_monthly: PRICING.MONTHLY_PRICE,
    price_annual: PRICING.ANNUAL_MONTHLY_EQUIVALENT,
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
