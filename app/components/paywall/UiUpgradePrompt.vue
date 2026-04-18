<script setup lang="ts">
import { NButton } from "naive-ui";
import { Lock } from "lucide-vue-next";
import { useRouter } from "#app";
import { useI18n } from "vue-i18n";

/**
 * Props for UiUpgradePrompt.
 */
interface Props {
  /**
   * Name of the gated feature, e.g. "Simulações Avançadas".
   * Displayed as a subtitle above the main headline.
   * Falls back to the generic i18n title when omitted.
   */
  featureName?: string;
  /**
   * Custom description to override the default i18n subtitle.
   */
  description?: string;
  /**
   * Label for the upgrade CTA button.
   * Falls back to the i18n value when omitted.
   */
  ctaLabel?: string;
}

defineProps<Props>();

const router = useRouter();
const { t } = useI18n();

/** Navigates the user to the plans page. */
const goToPlanos = (): void => {
  void router.push("/plans");
};
</script>

<template>
  <div class="ui-upgrade-prompt">
    <span v-if="featureName" class="ui-upgrade-prompt__feature-name">
      {{ featureName }}
    </span>

    <Lock class="ui-upgrade-prompt__icon" :size="36" aria-hidden="true" />

    <p class="ui-upgrade-prompt__title">
      {{ t("paywall.upgradePrompt.title") }}
    </p>

    <p class="ui-upgrade-prompt__description">
      {{ description ?? t("paywall.upgradePrompt.description") }}
    </p>

    <NButton
      type="primary"
      size="medium"
      class="ui-upgrade-prompt__cta"
      @click="goToPlanos"
    >
      {{ ctaLabel ?? t("paywall.upgradePrompt.ctaLabel") }}
    </NButton>
  </div>
</template>

<style scoped>
.ui-upgrade-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3, 12px);
  padding: var(--space-6, 24px) var(--space-4, 16px);
  text-align: center;
}

.ui-upgrade-prompt__feature-name {
  font-size: var(--font-size-body-xs, 11px);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--color-warning-dark, #92400e);
  background-color: var(--color-warning-light, #fef3c7);
  padding: 2px 10px;
  border-radius: var(--border-radius-full, 9999px);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ui-upgrade-prompt__icon {
  color: var(--color-warning, #ffb861);
  margin-top: var(--space-1, 4px);
}

.ui-upgrade-prompt__title {
  margin: 0;
  font-size: var(--font-size-body-lg, 18px);
  font-weight: var(--font-weight-bold, 700);
  color: var(--color-text-primary, #ffffff);
  line-height: 1.3;
}

.ui-upgrade-prompt__description {
  margin: 0;
  font-size: var(--font-size-body-sm, 14px);
  color: var(--color-text-secondary, #9ca3af);
  max-width: 320px;
  line-height: 1.5;
}

.ui-upgrade-prompt__cta {
  margin-top: var(--space-1, 4px);
}
</style>
