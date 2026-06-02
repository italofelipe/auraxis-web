<script setup lang="ts">
import { computed } from "vue";
import { NCard, NSwitch, NAlert, NButton, NSpin, NTag } from "naive-ui";
import { Bell, BellRing, CalendarClock, MailCheck, ShieldCheck } from "lucide-vue-next";

import { usePushSubscription } from "~/features/notifications/composables/usePushSubscription";
import NotificationPreferencesPanel from "~/features/notifications/components/NotificationPreferencesPanel.vue";

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Notificações",
  pageSubtitle: "Lembretes de vencimentos e alertas financeiros",
});

useHead({ title: "Notificações | Auraxis" });

const { t } = useI18n();
const runtimeConfig = useRuntimeConfig();
const isFeatureEnabled = computed<boolean>(
  (): boolean => runtimeConfig.public.pushNotificationsEnabled === true,
);

const { state, isSubscribed, isBusy, permission, error, subscribe, unsubscribe } =
  usePushSubscription();

const isUnsupported = computed<boolean>(() => state.value === "unsupported");
const isUnconfigured = computed<boolean>(
  (): boolean => !isFeatureEnabled.value || state.value === "unconfigured",
);
const isPermissionDenied = computed<boolean>(() => permission.value === "denied");
const canToggle = computed<boolean>(
  () =>
    isFeatureEnabled.value &&
    !isUnsupported.value &&
    state.value !== "unconfigured" &&
    !isPermissionDenied.value,
);
const isDeliveryPending = computed<boolean>(
  () => !isFeatureEnabled.value || state.value === "unconfigured",
);
const channelCards = [
  {
    title: "Gastos prestes a vencer",
    text: "Lembretes D-1 e no dia do vencimento ajudam a evitar atraso em despesas, cartões e contas cadastradas.",
    icon: CalendarClock,
  },
  {
    title: "Push no navegador",
    text: "Quando a chave VAPID e o backend estiverem ativos, o navegador poderá receber alertas mesmo com o app fechado.",
    icon: BellRing,
  },
  {
    title: "E-mail como fallback",
    text: "O envio por e-mail deve cobrir usuários sem permissão de push, respeitando preferências e limite de frequência.",
    icon: MailCheck,
  },
] as const;

/**
 * Handles user interaction with the opt-in switch.
 *
 * @param value - Desired switch state after the click.
 */
const onToggle = async (value: boolean): Promise<void> => {
  if (!isFeatureEnabled.value) {
    return;
  }
  if (value) {
    await subscribe();
  } else {
    await unsubscribe();
  }
};
</script>

<template>
  <div class="notifications-page">
    <section class="notifications-page__hero motion-fade-up" aria-labelledby="notifications-title">
      <div class="notifications-page__header">
        <span class="notifications-page__hero-icon">
          <Bell :size="24" aria-hidden="true" />
        </span>
        <div class="notifications-page__title-block">
          <p class="notifications-page__eyebrow">Push readiness</p>
          <h2 id="notifications-title" class="notifications-page__title">
            {{ t("pages.settings.notifications.title") }}
          </h2>
          <p class="notifications-page__subtitle">
            Configure como o Auraxis deve avisar quando um gasto estiver perto do vencimento. Push e
            e-mail entram como camadas complementares para reduzir esquecimentos sem lotar sua
            rotina de alertas.
          </p>
        </div>
      </div>

      <div class="notifications-page__status-bar" aria-label="Status dos canais">
        <NTag :type="isDeliveryPending ? 'warning' : 'success'" size="small" round>
          {{ isDeliveryPending ? "Disparo em preparação" : "Push configurado" }}
        </NTag>
        <NTag type="info" size="small" round>E-mail planejado como fallback</NTag>
        <NTag type="default" size="small" round>Preferências por usuário</NTag>
      </div>

      <div class="notifications-page__channels motion-stagger">
        <article
          v-for="card in channelCards"
          :key="card.title"
          class="notifications-page__channel motion-interactive"
        >
          <span class="notifications-page__channel-icon">
            <component :is="card.icon" :size="20" aria-hidden="true" />
          </span>
          <h3>{{ card.title }}</h3>
          <p>{{ card.text }}</p>
        </article>
      </div>
    </section>

    <NCard :bordered="true" class="notifications-page__card motion-pop">
      <div class="notifications-page__card-head">
        <ShieldCheck :size="20" aria-hidden="true" />
        <div>
          <h3>Preferências do navegador</h3>
          <p>Ative o opt-in quando a configuração de push estiver disponível no ambiente.</p>
        </div>
      </div>

      <NAlert
        v-if="isUnsupported"
        type="warning"
        :title="t('pages.settings.notifications.unsupportedTitle')"
        class="notifications-page__alert"
      >
        {{ t("pages.settings.notifications.unsupportedDescription") }}
      </NAlert>

      <NAlert
        v-else-if="isUnconfigured"
        type="info"
        :title="t('pages.settings.notifications.unconfiguredTitle')"
        class="notifications-page__alert"
      >
        {{ t("pages.settings.notifications.unconfiguredDescription") }}
      </NAlert>

      <NAlert
        v-else-if="isPermissionDenied"
        type="error"
        :title="t('pages.settings.notifications.deniedTitle')"
        class="notifications-page__alert"
      >
        {{ t("pages.settings.notifications.deniedDescription") }}
      </NAlert>

      <div class="notifications-page__toggle-row">
        <div class="notifications-page__toggle-labels">
          <span class="notifications-page__toggle-title">
            {{ t("pages.settings.notifications.toggleTitle") }}
          </span>
          <span class="notifications-page__toggle-help">
            {{ t("pages.settings.notifications.toggleHelp") }}
          </span>
        </div>
        <div class="notifications-page__toggle-control">
          <NSpin v-if="isBusy" :size="18" />
          <NSwitch v-else :value="isSubscribed" :disabled="!canToggle" @update:value="onToggle" />
        </div>
      </div>

      <NAlert v-if="error" type="error" class="notifications-page__alert">
        {{ error }}
      </NAlert>

      <div class="notifications-page__actions">
        <NButton size="small" quaternary tag="a" href="/subscription">
          {{ t("pages.settings.notifications.managePreferences") }}
        </NButton>
      </div>
    </NCard>

    <NotificationPreferencesPanel class="notifications-page__preferences" />
  </div>
</template>

<style scoped>
.notifications-page {
  width: min(1180px, 100%);
  display: grid;
  gap: var(--space-4);
  padding: clamp(var(--space-3), 3vw, var(--space-5));
}

.notifications-page__hero {
  display: grid;
  gap: var(--space-4);
  padding: clamp(var(--space-4), 4vw, var(--space-6));
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-xl);
  background:
    radial-gradient(
      circle at top right,
      color-mix(in srgb, var(--color-brand-500) 16%, transparent),
      transparent 24rem
    ),
    var(--color-bg-elevated);
  box-shadow: var(--shadow-card);
}

.notifications-page__header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}

.notifications-page__hero-icon,
.notifications-page__channel-icon {
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  color: var(--color-brand-500);
  background: color-mix(in srgb, var(--color-brand-500) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-brand-500) 22%, transparent);
  border-radius: var(--radius-lg);
}

.notifications-page__hero-icon {
  width: 48px;
  height: 48px;
}

.notifications-page__title-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.notifications-page__eyebrow {
  margin: 0;
  color: var(--color-brand-500);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0;
}

.notifications-page__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: clamp(1.6rem, 3vw, 2.4rem);
  line-height: 1.05;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.notifications-page__subtitle {
  margin: 0;
  max-width: 820px;
  font-size: var(--font-size-md);
  line-height: 1.65;
  color: var(--color-text-secondary);
}

.notifications-page__status-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.notifications-page__channels {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

.notifications-page__channel {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--color-bg-elevated) 86%, transparent);
}

.notifications-page__channel-icon {
  width: 40px;
  height: 40px;
}

.notifications-page__channel h3,
.notifications-page__card-head h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
}

.notifications-page__channel p,
.notifications-page__card-head p {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.55;
}

.notifications-page__card {
  border-radius: var(--radius-xl);
}

.notifications-page__card-head {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  color: var(--color-brand-500);
}

.notifications-page__alert {
  margin-bottom: var(--space-2);
}

.notifications-page__toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  padding-block: var(--space-2);
  border-top: 1px solid var(--color-outline-soft);
  border-bottom: 1px solid var(--color-outline-soft);
}

.notifications-page__toggle-labels {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.notifications-page__toggle-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.notifications-page__toggle-help {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.notifications-page__toggle-control {
  display: flex;
  align-items: center;
}

.notifications-page__actions {
  margin-top: var(--space-2);
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 860px) {
  .notifications-page__channels {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .notifications-page {
    padding-inline: var(--space-2);
  }

  .notifications-page__hero {
    padding: var(--space-4);
  }

  .notifications-page__header,
  .notifications-page__toggle-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
