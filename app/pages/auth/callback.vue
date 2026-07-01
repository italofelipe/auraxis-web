<script setup lang="ts">
import { onMounted } from "vue";

import { useSocialLogin } from "~/features/auth/composables/useSocialLogin";
import { useToast } from "~/composables/useToast";

definePageMeta({ layout: "auth" });

const { t } = useI18n();
const toast = useToast();
const { completeCallback } = useSocialLogin();

useSeoMeta({ title: t("auth.social.completing"), robots: "noindex, nofollow" });

/**
 * Completes the OAuth callback: the backend already set the httpOnly session
 * cookie, so we exchange it for an access token, populate the session, and land
 * on the dashboard. On any failure we surface a toast and return to /login.
 */
const completeLogin = async (): Promise<void> => {
  try {
    await completeCallback();
    await navigateTo("/dashboard");
  } catch {
    toast.error(t("auth.social.callbackError"), { duration: 5000 });
    await navigateTo("/login");
  }
};

onMounted(completeLogin);
</script>

<template>
  <div class="social-callback">
    <span class="social-callback__spinner" aria-hidden="true" />
    <p class="social-callback__label">{{ t("auth.social.completing") }}</p>
  </div>
</template>

<style scoped>
.social-callback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  min-height: 240px;
  color: var(--color-text-secondary);
}
.social-callback__spinner {
  width: 28px;
  height: 28px;
  border: 3px solid color-mix(in srgb, var(--color-brand-500) 24%, transparent);
  border-top-color: var(--color-brand-500);
  border-radius: 50%;
  animation: social-callback-spin 0.7s linear infinite;
}
.social-callback__label {
  margin: 0;
  font-size: var(--font-size-sm);
}
@keyframes social-callback-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .social-callback__spinner {
    animation: none;
  }
}
</style>
