<script setup lang="ts">
import { Mail } from "lucide-vue-next";
import { NButton } from "naive-ui";
import { useSessionStore } from "~/stores/session";

const { t } = useI18n();

const sessionStore = useSessionStore();

// Banner is visible when the user is authenticated but has not confirmed email.
// The `emailConfirmed` field is set on login from the backend response.
const isVisible = computed(
  () => sessionStore.isAuthenticated && sessionStore.emailConfirmed === false,
);
</script>

<template>
  <div
    v-if="isVisible"
    class="email-banner"
    role="alert"
    data-testid="email-confirmation-banner"
  >
    <Mail class="email-banner__icon" :size="16" />
    <p class="email-banner__message">{{ $t('auth.emailBanner.message') }}</p>
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

.email-banner__icon {
  flex-shrink: 0;
  color: var(--color-brand-500);
}

.email-banner__message {
  margin: 0;
  flex: 1 1 auto;
}
</style>
