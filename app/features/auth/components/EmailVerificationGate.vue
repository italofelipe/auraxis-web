<script setup lang="ts">
/**
 * EmailVerificationGate — modal that blocks the UI when the user tries to
 * perform a mutation after the 14-day email-verification grace period has
 * expired (backend returns 403 EMAIL_VERIFICATION_REQUIRED).
 *
 * Mounted once at the layout level. Subscribes to the `useEmailVerificationGate`
 * store; opens automatically when the HTTP interceptor catches the 403.
 *
 * UX rules:
 * - `mask-closable: false` + `closable: false` — user must take an action
 * - Two CTAs: resend confirmation email + refresh session
 * - Refresh action probes /auth/refresh; if the backend reports the user is
 *   now verified, the modal closes automatically.
 */
import { Mail, ShieldCheck } from "lucide-vue-next";
import { NButton, NModal } from "naive-ui";
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";

import { useToast } from "~/composables/useToast";
import { refreshAccessToken } from "~/composables/useHttp/useHttp";
import { useEmailVerificationGate } from "~/features/auth/composables/use-email-verification-gate";
import { useResendConfirmationMutation } from "~/features/auth/queries/use-resend-confirmation-mutation";
import { useSessionStore } from "~/stores/session";

const { t, locale } = useI18n();
const runtimeConfig = useRuntimeConfig();
const DEFAULT_API_BASE = "http://localhost:5000";

const gate = useEmailVerificationGate();
const { isOpen, payload } = storeToRefs(gate);

const sessionStore = useSessionStore();
const toast = useToast();
const resendMutation = useResendConfirmationMutation();

const isRefreshing = ref(false);

const deadlineFormatted = computed((): string | null => {
  const raw = payload.value?.deadlinePassedAt ?? null;
  if (raw === null) {
    return null;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toLocaleString(locale.value, {
    dateStyle: "long",
    timeStyle: "short",
  });
});

/**
 * Triggers the resend confirmation email mutation, surfacing a success or
 * error toast based on the outcome.
 */
const onResend = async (): Promise<void> => {
  try {
    await resendMutation.mutateAsync(undefined);
    toast.success(t("auth.emailGate.resendSuccess"));
  } catch {
    toast.error(t("auth.emailGate.resendError"));
  }
};

/**
 * Probes /auth/refresh to re-hydrate the session. If the backend reports
 * the user is no longer blocked by the grace period, the gate closes.
 */
const onRefresh = async (): Promise<void> => {
  isRefreshing.value = true;
  try {
    const apiBase = String(runtimeConfig.public.apiBase ?? DEFAULT_API_BASE);
    await refreshAccessToken(apiBase, sessionStore);
    if (!sessionStore.emailVerificationRequiredNow) {
      gate.close();
    }
  } finally {
    isRefreshing.value = false;
  }
};
</script>

<template>
  <NModal
    :show="isOpen"
    preset="card"
    :mask-closable="false"
    :closable="false"
    :close-on-esc="false"
    :title="t('auth.emailGate.title')"
    class="email-verification-gate"
    style="max-width: 520px"
    data-testid="email-verification-gate"
  >
    <div class="email-verification-gate__body">
      <div class="email-verification-gate__icon">
        <Mail :size="40" />
      </div>
      <p class="email-verification-gate__copy">
        {{ payload?.message ?? t('auth.emailGate.body') }}
      </p>
      <p
        v-if="deadlineFormatted"
        class="email-verification-gate__deadline"
        data-testid="email-verification-gate-deadline"
      >
        <ShieldCheck :size="14" />
        <span>{{ t('auth.emailGate.deadlinePassed', { date: deadlineFormatted }) }}</span>
      </p>
      <p class="email-verification-gate__hint">
        {{ t('auth.emailGate.refreshHint') }}
      </p>
    </div>

    <template #action>
      <div class="email-verification-gate__actions">
        <NButton
          :loading="isRefreshing"
          :disabled="resendMutation.isPending.value"
          ghost
          data-testid="email-verification-gate-refresh"
          @click="onRefresh"
        >
          {{ isRefreshing
            ? t('auth.emailGate.ctaRefreshing')
            : t('auth.emailGate.ctaRefresh')
          }}
        </NButton>
        <NButton
          type="primary"
          :loading="resendMutation.isPending.value"
          :disabled="isRefreshing"
          data-testid="email-verification-gate-resend"
          @click="onResend"
        >
          {{ resendMutation.isPending.value
            ? t('auth.emailGate.ctaResending')
            : t('auth.emailGate.ctaResend')
          }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.email-verification-gate__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  text-align: center;
  padding: var(--space-2) 0;
}

.email-verification-gate__icon {
  align-self: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-brand-500) 14%, transparent);
  color: var(--color-brand-500);
}

.email-verification-gate__copy {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  line-height: 1.5;
}

.email-verification-gate__deadline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.email-verification-gate__hint {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.email-verification-gate__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2);
  width: 100%;
}
</style>
