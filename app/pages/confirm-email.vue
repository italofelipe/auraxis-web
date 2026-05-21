<script setup lang="ts">
/**
 * Magic-link login page (#1338).
 *
 * Mounted on `/confirm-email?token=HMAC`. Sends the HMAC token to the
 * backend; on success the backend mints an access JWT + refresh cookie and
 * we sign the user in transparently. Failure cases (expired/invalid token)
 * render an error state with a "resend" CTA — no automatic redirect.
 *
 * Page meta:
 * - `layout: 'auth'` — no sidebar, no default-layout colateral queries that
 *   could trigger the global Sessão expirada modal.
 * - `middleware: []` — must be accessible without an existing session, since
 *   the click can come from a device where the user is not logged in.
 */
import { CheckCircle2, XCircle } from "lucide-vue-next";
import { NButton, NSpin } from "naive-ui";
import { computed, onMounted } from "vue";

import { useConfirmEmailMutation } from "~/features/auth/queries/use-confirm-email-mutation";
import type { ConfirmEmailResult } from "~/features/auth/services/auth-email.client";
import { useSessionStore } from "~/stores/session";

definePageMeta({
  layout: "auth",
  // Public route: must work regardless of whether the user already has a
  // session. Existing sessions are gracefully replaced by the magic-link.
  middleware: [],
});

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const sessionStore = useSessionStore();

useSeoMeta({
  title: t("pages.confirmEmail.meta.title"),
  description: t("pages.confirmEmail.meta.description"),
  robots: "noindex, nofollow",
});

const mutation = useConfirmEmailMutation();

const token = computed(() => {
  const raw = route.query.token;
  return typeof raw === "string" && raw.length > 0 ? raw : null;
});

/**
 * Hydrates the session store with the canonical v3 user from the response
 * and triggers the soft redirect into the app.
 *
 * @param result Response payload from `useConfirmEmailMutation`.
 */
const completeSignIn = (result: ConfirmEmailResult): void => {
  const verification = result.user.email_verification;
  sessionStore.signIn({
    accessToken: result.token,
    userEmail: result.user.identity.email,
    emailVerified: verification.verified,
    emailVerificationDeadlineAt: verification.deadline_at,
    emailVerificationRequiredNow: verification.required_now,
    daysUntilEmailRequired: verification.days_remaining,
    // Legacy mirrors keep older components in sync until v3 migration is done.
    emailConfirmed: verification.verified,
    emailConfirmationDeadlineAt: verification.deadline_at,
    emailConfirmationBlocked: verification.required_now,
  });
};

onMounted(async () => {
  if (!token.value) {
    return;
  }
  try {
    const result = await mutation.mutateAsync(token.value);
    completeSignIn(result);
    // Tiny micro-celebration before bouncing into the app. 800ms is enough
    // for the user to register that something happened ("Email confirmado!")
    // without feeling like a delay.
    setTimeout(() => {
      void router.push("/dashboard");
    }, 800);
  } catch {
    // mutation.isError flips automatically; UI below renders the error state.
  }
});

const status = computed((): "idle" | "pending" | "success" | "error" => {
  if (mutation.isPending.value) { return "pending"; }
  if (mutation.isSuccess.value) { return "success"; }
  if (mutation.isError.value) { return "error"; }
  return token.value ? "pending" : "idle";
});
</script>

<template>
  <div class="confirm-email">
    <div class="confirm-email__card">
      <!-- Loading -->
      <template v-if="status === 'pending'">
        <NSpin :size="48" />
        <h1>{{ $t('pages.confirmEmail.confirming') }}</h1>
        <p>{{ $t('pages.confirmEmail.wait') }}</p>
      </template>

      <!-- Success (800ms before auto-redirect) -->
      <template v-else-if="status === 'success'">
        <CheckCircle2 class="confirm-email__icon confirm-email__icon--success" :size="64" />
        <h1>{{ $t('pages.confirmEmail.successTitle') }}</h1>
        <p>{{ $t('pages.confirmEmail.successDescription') }}</p>
      </template>

      <!-- Error: expired / invalid / reused token -->
      <template v-else-if="status === 'error'">
        <XCircle class="confirm-email__icon confirm-email__icon--error" :size="64" />
        <h1>{{ $t('pages.confirmEmail.errorTitle') }}</h1>
        <p>{{ $t('pages.confirmEmail.errorDescription') }}</p>
        <NButton type="primary" tag="a" href="/resend-confirmation">
          {{ $t('pages.confirmEmail.resendCta') }}
        </NButton>
      </template>

      <!-- No token in URL -->
      <template v-else>
        <XCircle class="confirm-email__icon confirm-email__icon--muted" :size="64" />
        <h1>{{ $t('pages.confirmEmail.noTokenTitle') }}</h1>
        <p>{{ $t('pages.confirmEmail.noTokenDescription') }}</p>
        <NButton type="default" tag="a" href="/resend-confirmation">
          {{ $t('pages.confirmEmail.resendCta') }}
        </NButton>
      </template>
    </div>
  </div>
</template>

<style scoped>
.confirm-email {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: var(--space-4);
}

.confirm-email__card {
  text-align: center;
  max-width: 480px;
  display: grid;
  gap: var(--space-3);
  justify-items: center;
}

.confirm-email__card h1 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-lg);
}

.confirm-email__card p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.confirm-email__icon--success {
  color: var(--color-positive);
}

.confirm-email__icon--error {
  color: var(--color-negative);
}

.confirm-email__icon--muted {
  color: var(--color-text-muted);
}
</style>
