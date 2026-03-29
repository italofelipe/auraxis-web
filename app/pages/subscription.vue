<script setup lang="ts">
import {
  NCard,
  NTag,
  NText,
  NButton,
  NAlert,
  NGrid,
  NGridItem,
  NPageHeader,
} from "naive-ui";
import { useSubscriptionQuery } from "~/features/subscription/queries/use-subscription-query";
import { useCancelSubscriptionMutation } from "~/features/subscription/queries/use-cancel-subscription-mutation";
import { useCreateCheckoutMutation } from "~/features/subscription/queries/use-create-checkout-mutation";
import type { SubscriptionStatus } from "~/features/subscription/model/subscription";
import type { PlanDto, PlanSlug } from "~/features/subscription/contracts/subscription.dto";

definePageMeta({
  layout: "default",
  middleware: ["authenticated"],
  pageTitle: "Assinatura",
  pageSubtitle: "Gerencie seu plano Auraxis",
});

useHead({ title: "Assinatura | Auraxis" });

const ALL_PLANS: PlanDto[] = [
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
];

const { data: subscription, isLoading, isError } = useSubscriptionQuery();
const cancelMutation = useCancelSubscriptionMutation();
const checkoutMutation = useCreateCheckoutMutation();

const currentPlan = computed<PlanDto | null>(() => {
  if (!subscription.value) {return null;}
  return ALL_PLANS.find((p) => p.slug === (subscription.value!.planSlug as PlanSlug)) ?? null;
});

const status = computed<SubscriptionStatus | "none">(() => subscription.value?.status ?? "none");

/**
 * Returns a human-readable label for a subscription status.
 *
 * @param s - The subscription status value.
 * @returns Localised label string in PT-BR.
 */
const statusLabel = (s: SubscriptionStatus | "none"): string => {
  const map: Record<SubscriptionStatus | "none", string> = {
    active: "Ativo",
    canceled: "Cancelado",
    past_due: "Em atraso",
    trialing: "Período de teste",
    none: "Sem assinatura",
  };
  return map[s];
};

/**
 * Resolves the NaiveUI tag type for a given subscription status.
 *
 * @param s - The subscription status value.
 * @returns NaiveUI tag type string.
 */
const statusTagType = (
  s: SubscriptionStatus | "none",
): "success" | "error" | "warning" | "info" | "default" => {
  const map: Record<SubscriptionStatus | "none", "success" | "error" | "warning" | "info" | "default"> = {
    active: "success",
    canceled: "error",
    past_due: "warning",
    trialing: "info",
    none: "default",
  };
  return map[s];
};

/**
 * Formats an ISO date string to a localised PT-BR short date.
 *
 * @param value - ISO date string.
 * @returns Formatted date string like "31/12/2026".
 */
const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));

const showCancelButton = computed(
  () => status.value === "active" || status.value === "trialing",
);

const showWarningAlert = computed(
  () => status.value === "past_due" || status.value === "canceled",
);

const warningAlertMessage = computed((): string => {
  if (status.value === "past_due") {
    return "Sua assinatura está em atraso. Atualize seu método de pagamento para continuar usando o Auraxis.";
  }
  return "Sua assinatura foi cancelada. Escolha um plano abaixo para reativar.";
});

/** Cancels the active subscription. */
const onCancelSubscription = (): void => {
  cancelMutation.mutate();
};

/**
 * Initiates checkout for the selected plan.
 * Redirects to the returned checkout URL on success.
 *
 * @param slug - The selected plan slug.
 */
const onSelectPlan = (slug: string): void => {
  checkoutMutation.mutate(slug, {
    onSuccess: (checkoutUrl: string) => {
      window.location.href = checkoutUrl;
    },
  });
};
</script>

<template>
  <div class="subscription-page">
    <NPageHeader
      title="Assinatura"
      subtitle="Gerencie seu plano Auraxis"
    />

    <UiInlineError
      v-if="isError"
      title="Não foi possível carregar a assinatura"
      message="Tente recarregar a página."
    />

    <template v-else>
      <UiPageLoader v-if="isLoading" :rows="3" :with-title="true" />

      <template v-else>
        <NAlert
          v-if="showWarningAlert"
          type="warning"
          :title="status === 'past_due' ? 'Pagamento em atraso' : 'Assinatura cancelada'"
          class="subscription-page__alert"
        >
          {{ warningAlertMessage }}
        </NAlert>

        <NCard v-if="subscription" :bordered="true" class="subscription-page__status-card">
          <div class="subscription-page__status-row">
            <div class="subscription-page__status-info">
              <div class="subscription-page__status-header">
                <NText strong class="subscription-page__plan-name">
                  {{ currentPlan?.name ?? subscription.planSlug }}
                </NText>
                <NTag :type="statusTagType(status)" size="small" :bordered="false">
                  {{ statusLabel(status) }}
                </NTag>
              </div>
              <NText
                v-if="subscription.currentPeriodEnd"
                class="subscription-page__period-end"
                depth="3"
              >
                Próxima cobrança: {{ formatDate(subscription.currentPeriodEnd) }}
              </NText>
            </div>
            <NButton
              v-if="showCancelButton"
              type="error"
              size="small"
              quaternary
              :loading="cancelMutation.isPending.value"
              @click="onCancelSubscription"
            >
              Cancelar assinatura
            </NButton>
          </div>
        </NCard>

        <div class="subscription-page__plans-section">
          <NText tag="h3" class="subscription-page__plans-title">
            Escolha seu plano
          </NText>
          <NGrid :x-gap="16" :y-gap="16" :cols="4" responsive="screen" item-responsive>
            <NGridItem
              v-for="plan in ALL_PLANS"
              :key="plan.slug"
              :span="4"
              :xs="4"
              :s="2"
              :m="2"
              :l="1"
            >
              <PlanCard
                :plan="plan"
                :is-current="plan.slug === subscription?.planSlug"
                :loading="checkoutMutation.isPending.value && checkoutMutation.variables.value === plan.slug"
                @select="onSelectPlan"
              />
            </NGridItem>
          </NGrid>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.subscription-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3);
}

.subscription-page__alert {
  border-radius: var(--radius-md);
}

.subscription-page__status-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.subscription-page__status-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.subscription-page__status-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.subscription-page__plan-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.subscription-page__period-end {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.subscription-page__plans-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.subscription-page__plans-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}
</style>
