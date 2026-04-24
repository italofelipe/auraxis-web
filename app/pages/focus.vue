<script setup lang="ts">
import { computed, ref } from "vue";
import { NButton } from "naive-ui";
import { Sparkles } from "lucide-vue-next";
import PaywallGate from "~/components/paywall/PaywallGate.vue";
import { useFocusMetric } from "~/features/focus/composables/useFocusMetric";
import FocusMetricDisplay from "~/features/focus/components/FocusMetricDisplay.vue";
import FocusMetricSelector from "~/features/focus/components/FocusMetricSelector.vue";
import type { FocusMetricId } from "~/features/focus/model/focus-metric";

definePageMeta({
  layout: "default",
  middleware: ["authenticated"],
  pageTitle: "Foco",
  pageSubtitle: "Um número. Aquele que importa agora.",
});

const { t } = useI18n();

useHead({ title: "Foco | Auraxis" });

const { selectedId, metric, isLoading, selectMetric } = useFocusMetric();

const selectorOpen = ref<boolean>(false);

/** Opens the focus-metric selector modal. */
const openSelector = (): void => { selectorOpen.value = true; };

/** Closes the focus-metric selector modal. */
const closeSelector = (): void => { selectorOpen.value = false; };

/**
 * Commits a new focus metric selection.
 *
 * @param id Focus metric id chosen in the selector.
 */
const onSelect = (id: FocusMetricId): void => {
  selectMetric(id);
};

const upgradeHref = computed<string>(() => "/plans");
</script>

<template>
  <div class="focus-page" data-testid="focus-page">
    <PaywallGate feature="focus_mode">
      <section class="focus-page__stage" data-testid="focus-page-granted">
        <FocusMetricDisplay :metric="metric" :is-loading="isLoading" />
        <NButton quaternary size="small" class="focus-page__change" data-testid="focus-page-change" @click="openSelector">
          {{ t("focus.page.change") }}
        </NButton>
        <p class="focus-page__hint">{{ t("focus.page.footerHint") }}</p>
        <FocusMetricSelector
          :open="selectorOpen"
          :selected-id="selectedId"
          @select="onSelect"
          @close="closeSelector"
        />
      </section>

      <template #locked>
        <section class="focus-page__paywall" data-testid="focus-page-paywall">
          <Sparkles :size="36" class="focus-page__paywall-icon" />
          <h2 class="focus-page__paywall-title">{{ t("focus.paywall.title") }}</h2>
          <p class="focus-page__paywall-description">{{ t("focus.paywall.description") }}</p>
          <NButton type="primary" size="medium" tag="a" :href="upgradeHref" data-testid="focus-page-upgrade-cta">
            {{ t("focus.paywall.cta") }}
          </NButton>
        </section>
      </template>
    </PaywallGate>
  </div>
</template>

<style scoped>
.focus-page {
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background: var(--color-bg-subtle, var(--color-bg));
}

.focus-page__stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  max-width: 640px;
  width: 100%;
  text-align: center;
}

.focus-page__change {
  margin-top: var(--space-2);
}

.focus-page__hint {
  margin-top: var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  max-width: 42ch;
}

.focus-page__paywall {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  max-width: 480px;
  text-align: center;
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
}

.focus-page__paywall-icon {
  color: var(--color-primary);
}

.focus-page__paywall-title {
  font-family: var(--font-heading);
  font-size: var(--font-size-xl);
  margin: 0;
  color: var(--color-text-primary);
}

.focus-page__paywall-description {
  margin: 0 0 var(--space-2);
  color: var(--color-text-muted);
  max-width: 36ch;
}
</style>
