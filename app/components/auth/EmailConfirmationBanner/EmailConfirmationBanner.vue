<script setup lang="ts">
/**
 * In-page banner that nudges users to confirm their email during the 14-day
 * grace period. Three visual states based on `daysUntilEmailRequired`:
 *
 *  - **info** (≥ 8 days)   — gentle reminder
 *  - **urgent** (1–7 days) — warning copy with countdown
 *  - **expired** (≤ 0)     — read-only mode notice
 *
 * The persistent blocking modal is rendered separately by
 * `EmailVerificationGate` (features/auth) — this banner only hints.
 */
import { computed } from "vue";
import { Mail } from "lucide-vue-next";
import { NButton } from "naive-ui";
import { useSessionStore } from "~/stores/session";

const { t } = useI18n();
const sessionStore = useSessionStore();

const isVisible = computed(
  () => sessionStore.isAuthenticated && !sessionStore.emailVerified,
);

const daysRemaining = computed((): number | null => {
  const raw = sessionStore.daysUntilEmailRequired;
  return raw === null ? null : Number(raw);
});

type BannerVariant = "info" | "urgent" | "expired";

const variant = computed((): BannerVariant => {
  const days = daysRemaining.value;
  if (days === null) {
    return "info";
  }
  if (days <= 0) {
    return "expired";
  }
  if (days <= 7) {
    return "urgent";
  }
  return "info";
});

const message = computed((): string => {
  const days = daysRemaining.value;
  if (variant.value === "expired") {
    return t("auth.emailBanner.expired");
  }
  if (days === null) {
    return t("auth.emailBanner.message");
  }
  const key = variant.value === "urgent"
    ? "auth.emailBanner.urgent"
    : "auth.emailBanner.countdown";
  return t(key, { count: days }, days);
});
</script>

<template>
  <div
    v-if="isVisible"
    class="email-banner"
    :class="`email-banner--${variant}`"
    role="alert"
    :data-variant="variant"
    data-testid="email-confirmation-banner"
  >
    <Mail class="email-banner__icon" :size="16" />
    <p class="email-banner__message">{{ message }}</p>
    <NButton size="small" type="primary" tag="a" href="/resend-confirmation">
      {{ t('auth.emailBanner.cta') }}
    </NButton>
  </div>
</template>

<style scoped>
.email-banner {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: color-mix(in srgb, var(--color-brand-500) 12%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--color-brand-500) 30%, transparent);
  color: var(--color-text-primary);
  font-size: var(--font-size-xs);
}

.email-banner--urgent {
  background: color-mix(in srgb, var(--color-warning) 14%, transparent);
  border-bottom-color: color-mix(in srgb, var(--color-warning) 40%, transparent);
}

.email-banner--expired {
  background: color-mix(in srgb, var(--color-negative) 16%, transparent);
  border-bottom-color: color-mix(in srgb, var(--color-negative) 45%, transparent);
}

.email-banner__icon {
  flex-shrink: 0;
  color: var(--color-brand-500);
}

.email-banner--urgent .email-banner__icon {
  color: var(--color-warning);
}

.email-banner--expired .email-banner__icon {
  color: var(--color-negative);
}

.email-banner__message {
  margin: 0;
  flex: 1 1 auto;
}
</style>
