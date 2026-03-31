<script setup lang="ts">
import { Mail, Clock, ShieldCheck, AlertTriangle } from "lucide-vue-next";
import { NButton, NAlert } from "naive-ui";
import { useResendConfirmationMutation } from "~/features/auth/queries/use-resend-confirmation-mutation";
import { useSessionStore } from "~/stores/session";

definePageMeta({
  // Accessible to authenticated users only — guests have no email to confirm.
  middleware: ["authenticated"],
  layout: "auth",
});

const { t } = useI18n();

useSeoMeta({
  title: t("pages.confirmEmailPending.meta.title"),
  robots: "noindex, nofollow",
});

const sessionStore = useSessionStore();
const resendMutation = useResendConfirmationMutation();

/** Masked email shown in the UI (preserves privacy while giving context). */
const maskedEmail = computed((): string => {
  const email = sessionStore.userEmail;
  if (!email) { return ""; }
  const [local, domain] = email.split("@");
  if (!local || !domain) { return email; }
  const visible = local.length > 2 ? local.slice(0, 2) : local[0];
  return `${visible}***@${domain}`;
});

/** Triggers a new confirmation email. */
const handleResend = (): void => {
  resendMutation.mutate(undefined);
};

/** Skips confirmation and takes the user to the dashboard (already logged in). */
const handleSkip = async (): Promise<void> => {
  await navigateTo("/dashboard");
};
</script>

<template>
  <div class="confirm-pending">
    <div class="confirm-pending__card">
      <!-- ── Icon ─────────────────────────────────────────────────────── -->
      <div class="confirm-pending__icon-wrap">
        <Mail class="confirm-pending__icon" :size="48" aria-hidden="true" />
      </div>

      <!-- ── Heading ────────────────────────────────────────────────── -->
      <div class="confirm-pending__heading">
        <h1 class="confirm-pending__title">{{ $t('pages.confirmEmailPending.title') }}</h1>
        <p class="confirm-pending__desc">
          {{ $t('pages.confirmEmailPending.description') }}
          <strong v-if="maskedEmail" class="confirm-pending__email">{{ maskedEmail }}</strong>
        </p>
      </div>

      <!-- ── 7-day warning ──────────────────────────────────────────── -->
      <div class="confirm-pending__deadline-card">
        <Clock class="confirm-pending__deadline-icon" :size="20" aria-hidden="true" />
        <div class="confirm-pending__deadline-text">
          <span class="confirm-pending__deadline-heading">
            {{ $t('pages.confirmEmailPending.deadline.heading') }}
          </span>
          <span class="confirm-pending__deadline-body">
            {{ $t('pages.confirmEmailPending.deadline.body') }}
          </span>
        </div>
        <AlertTriangle class="confirm-pending__deadline-warning" :size="16" aria-hidden="true" />
      </div>

      <!-- ── What you get after confirming ─────────────────────────── -->
      <ul class="confirm-pending__benefits" aria-label="Benefícios da confirmação">
        <li class="confirm-pending__benefit">
          <ShieldCheck :size="15" aria-hidden="true" />
          {{ $t('pages.confirmEmailPending.benefits.access') }}
        </li>
        <li class="confirm-pending__benefit">
          <ShieldCheck :size="15" aria-hidden="true" />
          {{ $t('pages.confirmEmailPending.benefits.recovery') }}
        </li>
        <li class="confirm-pending__benefit">
          <ShieldCheck :size="15" aria-hidden="true" />
          {{ $t('pages.confirmEmailPending.benefits.notifications') }}
        </li>
      </ul>

      <!-- ── Resend feedback ────────────────────────────────────────── -->
      <NAlert
        v-if="resendMutation.isSuccess.value"
        type="success"
        :show-icon="true"
        class="confirm-pending__alert"
      >
        {{ $t('pages.confirmEmailPending.resent') }}
      </NAlert>

      <NAlert
        v-if="resendMutation.isError.value"
        type="error"
        :show-icon="true"
        class="confirm-pending__alert"
      >
        {{ resendMutation.error.value?.message ?? $t('pages.confirmEmailPending.resendError') }}
      </NAlert>

      <!-- ── Actions ────────────────────────────────────────────────── -->
      <div class="confirm-pending__actions">
        <NButton
          type="default"
          :loading="resendMutation.isPending.value"
          :disabled="resendMutation.isPending.value || resendMutation.isSuccess.value"
          block
          @click="handleResend"
        >
          {{ resendMutation.isSuccess.value
            ? $t('pages.confirmEmailPending.resentCta')
            : $t('pages.confirmEmailPending.resendCta') }}
        </NButton>

        <button class="confirm-pending__skip" type="button" @click="handleSkip">
          {{ $t('pages.confirmEmailPending.skip') }}
        </button>
      </div>

      <!-- ── Skip explanation ───────────────────────────────────────── -->
      <p class="confirm-pending__skip-note">
        {{ $t('pages.confirmEmailPending.skipNote') }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.confirm-pending {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  padding: var(--space-4);
}

.confirm-pending__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  text-align: center;
  max-width: 420px;
  width: 100%;
}

/* ── Icon ──────────────────────────────────────────────────────────────── */
.confirm-pending__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: 88px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--color-brand-500) 12%, transparent);
  flex-shrink: 0;
}

.confirm-pending__icon {
  color: var(--color-brand-500);
}

/* ── Heading ────────────────────────────────────────────────────────────── */
.confirm-pending__heading {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.confirm-pending__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-md);
  line-height: var(--line-height-heading-md);
  color: var(--color-text-primary);
}

.confirm-pending__desc {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.confirm-pending__email {
  color: var(--color-text-primary);
}

/* ── Deadline card ──────────────────────────────────────────────────────── */
.confirm-pending__deadline-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3);
  background: color-mix(in srgb, #f59e0b 10%, transparent);
  border: 1px solid color-mix(in srgb, #f59e0b 30%, transparent);
  border-radius: var(--radius-md);
  text-align: left;
  width: 100%;
}

.confirm-pending__deadline-icon {
  color: #f59e0b;
  flex-shrink: 0;
  margin-top: 2px;
}

.confirm-pending__deadline-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.confirm-pending__deadline-heading {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: color-mix(in srgb, #f59e0b 90%, var(--color-text-primary));
}

.confirm-pending__deadline-body {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.confirm-pending__deadline-warning {
  color: #f59e0b;
  flex-shrink: 0;
  margin-top: 2px;
}

/* ── Benefits list ──────────────────────────────────────────────────────── */
.confirm-pending__benefits {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  width: 100%;
}

.confirm-pending__benefit {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  text-align: left;
}

.confirm-pending__benefit svg {
  color: var(--color-positive);
  flex-shrink: 0;
}

/* ── Alert ──────────────────────────────────────────────────────────────── */
.confirm-pending__alert {
  width: 100%;
}

/* ── Actions ────────────────────────────────────────────────────────────── */
.confirm-pending__actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
}

.confirm-pending__skip {
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  text-decoration: underline;
  text-underline-offset: 2px;
  padding: var(--space-1) 0;
  transition: color 0.15s ease;
}

.confirm-pending__skip:hover {
  color: var(--color-text-secondary);
}

/* ── Skip note ──────────────────────────────────────────────────────────── */
.confirm-pending__skip-note {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  line-height: 1.5;
  max-width: 340px;
}
</style>
