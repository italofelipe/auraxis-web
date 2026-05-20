<script setup lang="ts">
import { NButton } from "naive-ui";
import { Lock } from "lucide-vue-next";
import { useRouter } from "#app";

import { useAnalytics } from "~/composables/useAnalytics/useAnalytics";

interface Props {
  /**
   * Source label attached to the `upgrade_clicked` event so funnels can
   * split CTA clicks by the surface where they appeared (e.g.
   * `dashboard-banner`, `tool-page`, `feature-modal`).
   */
  source?: string;
}

const props = withDefaults(defineProps<Props>(), {
  source: "upgrade-cta",
});

const router = useRouter();
const analytics = useAnalytics();

/** Navigates the user to the plans page. */
const goToPlanos = (): void => {
  // #524 — this CTA doesn't trigger checkout itself (it routes to /plans),
  // but it's still a deliberate upgrade-intent signal. Capture it before
  // navigating so the funnel sees the click even when the user bounces
  // off /plans without converting.
  analytics.capture("upgrade_clicked", {
    source: props.source,
    destination: "/plans",
  });
  void router.push("/plans");
};
</script>

<template>
  <div class="upgrade-cta">
    <Lock class="upgrade-cta__icon" :size="32" />
    <p class="upgrade-cta__title">{{ $t('paywall.upgradeCTA.title') }}</p>
    <p class="upgrade-cta__subtitle">
      {{ $t('paywall.upgradeCTA.subtitle') }}
    </p>
    <NButton type="primary" size="medium" @click="goToPlanos">
      {{ $t('paywall.upgradeCTA.button') }}
    </NButton>
  </div>
</template>

<style scoped>
.upgrade-cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4);
  text-align: center;
}

.upgrade-cta__icon {
  color: var(--color-warning, #ffb861);
}

.upgrade-cta__title {
  margin: 0;
  font-size: var(--font-size-body-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-900);
}

.upgrade-cta__subtitle {
  margin: 0;
  font-size: var(--font-size-body-sm);
  color: var(--color-neutral-600);
}
</style>
