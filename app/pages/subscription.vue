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
import PlanCard from "~/features/subscription/components/PlanCard/PlanCard.vue";
import {
  MOCK_CURRENT_SUBSCRIPTION,
  MOCK_ALL_PLANS,
} from "~/features/subscription/mock/subscription.mock";
import type { SubscriptionStatus } from "~/features/subscription/contracts/subscription.dto";

definePageMeta({
  layout: "default",
  middleware: ["authenticated"],
  pageTitle: "Assinatura",
  pageSubtitle: "Gerencie seu plano Auraxis",
});

useHead({ title: "Assinatura | Auraxis" });

const subscription = ref({ ...MOCK_CURRENT_SUBSCRIPTION });
const plans = ref([...MOCK_ALL_PLANS]);

/**
 * Returns a human-readable label for a subscription status.
 *
 * @param status - The subscription status value.
 * @returns Localised label string in PT-BR.
 */
const statusLabel = (status: SubscriptionStatus): string => {
  const map: Record<SubscriptionStatus, string> = {
    active: "Ativo",
    canceled: "Cancelado",
    past_due: "Em atraso",
    trialing: "Período de teste",
    none: "Sem assinatura",
  };
  return map[status];
};

/**
 * Resolves the NaiveUI tag type for a given subscription status.
 *
 * @param status - The subscription status value.
 * @returns NaiveUI tag type string.
 */
const statusTagType = (
  status: SubscriptionStatus,
): "success" | "error" | "warning" | "info" | "default" => {
  const map: Record<SubscriptionStatus, "success" | "error" | "warning" | "info" | "default"> = {
    active: "success",
    canceled: "error",
    past_due: "warning",
    trialing: "info",
    none: "default",
  };
  return map[status];
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
  () =>
    subscription.value.status === "active" &&
    !subscription.value.cancel_at_period_end,
);

const showWarningAlert = computed(
  () =>
    subscription.value.status === "past_due" ||
    subscription.value.status === "canceled",
);

const warningAlertMessage = computed((): string => {
  if (subscription.value.status === "past_due") {
    return "Sua assinatura está em atraso. Atualize seu método de pagamento para continuar usando o Auraxis.";
  }
  return "Sua assinatura foi cancelada. Escolha um plano abaixo para reativar.";
});

/** Handles cancel subscription action. Updates local state. */
const onCancelSubscription = (): void => {
  subscription.value = { ...subscription.value, cancel_at_period_end: true };
};

/**
 * Handles plan selection. Updates the current subscription plan in local state.
 *
 * @param slug - The selected plan slug.
 */
const onSelectPlan = (slug: string): void => {
  const selected = plans.value.find((p) => p.slug === slug);
  if (!selected) {return;}
  subscription.value = {
    ...subscription.value,
    plan: selected,
    status: "active",
    cancel_at_period_end: false,
  };
};
</script>

<template>
  <div class="subscription-page">
    <NPageHeader
      title="Assinatura"
      subtitle="Gerencie seu plano Auraxis"
    />

    <NAlert
      v-if="showWarningAlert"
      type="warning"
      :title="subscription.status === 'past_due' ? 'Pagamento em atraso' : 'Assinatura cancelada'"
      class="subscription-page__alert"
    >
      {{ warningAlertMessage }}
    </NAlert>

    <NCard :bordered="true" class="subscription-page__status-card">
      <div class="subscription-page__status-row">
        <div class="subscription-page__status-info">
          <div class="subscription-page__status-header">
            <NText strong class="subscription-page__plan-name">
              {{ subscription.plan.name }}
            </NText>
            <NTag :type="statusTagType(subscription.status)" size="small" :bordered="false">
              {{ statusLabel(subscription.status) }}
            </NTag>
          </div>
          <NText
            v-if="subscription.current_period_end"
            class="subscription-page__period-end"
            depth="3"
          >
            Próxima cobrança: {{ formatDate(subscription.current_period_end) }}
          </NText>
          <NText
            v-if="subscription.cancel_at_period_end"
            class="subscription-page__cancel-notice"
            depth="3"
          >
            Assinatura será cancelada ao fim do período atual.
          </NText>
        </div>
        <NButton
          v-if="showCancelButton"
          type="error"
          size="small"
          quaternary
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
          v-for="plan in plans"
          :key="plan.slug"
          :span="4"
          :xs="4"
          :s="2"
          :m="2"
          :l="1"
        >
          <PlanCard
            :plan="plan"
            :is-current="plan.slug === subscription.plan.slug"
            @select="onSelectPlan"
          />
        </NGridItem>
      </NGrid>
    </div>
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

.subscription-page__cancel-notice {
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
