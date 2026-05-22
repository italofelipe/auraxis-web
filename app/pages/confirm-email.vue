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
import { computed, onMounted, ref } from "vue";

import { useConfirmEmailMutation } from "~/features/auth/queries/use-confirm-email-mutation";
import type { ConfirmEmailResult } from "~/features/auth/services/auth-email.client";
import { useAnalytics } from "~/composables/useAnalytics";
import { ApiError } from "~/core/errors";
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
const analytics = useAnalytics();

useSeoMeta({
  title: t("pages.confirmEmail.meta.title"),
  description: t("pages.confirmEmail.meta.description"),
  robots: "noindex, nofollow",
});

const mutation = useConfirmEmailMutation();
const initialBrowserToken = import.meta.client
  ? readTokenFromBrowserSnapshot()
  : null;

/**
 * Extracts a token from a URL or query string, tolerating both absolute URLs
 * and raw `?token=...` values.
 *
 * @param source URL-like source to inspect.
 * @returns Confirmation token when present.
 */
function readTokenFromUrlSource(source: string | null | undefined): string | null {
  if (!source) {
    return null;
  }
  const params = source.startsWith("?")
    ? new URLSearchParams(source)
    : new URL(source, window.location.origin).searchParams;
  const token = params.get("token");
  return token && token.length > 0 ? token : null;
}

/**
 * Reads the token from browser-owned navigation data. This survives Nuxt route
 * normalization that can briefly strip the query string during hydration.
 *
 * @returns Confirmation token from the current URL or original navigation URL.
 */
function readTokenFromBrowserSnapshot(): string | null {
  const currentToken = readTokenFromUrlSource(window.location.search);
  if (currentToken) {
    return currentToken;
  }
  const navigationEntry = performance.getEntriesByType("navigation")[0];
  const navigationUrl = navigationEntry && "name" in navigationEntry
    ? navigationEntry.name
    : null;
  return readTokenFromUrlSource(navigationUrl);
}

/**
 * Reads the confirmation token from Nuxt route state and falls back to the
 * browser URL. Static/preview builds can hydrate this public route before
 * `route.query` reflects the magic-link search params. During hydration,
 * Nuxt may also briefly normalize the current route without the query string;
 * the setup-time browser token keeps magic links stable through that window.
 *
 * @returns Confirmation token, or null when the URL has no usable token.
 */
function readConfirmationToken(): string | null {
  const raw = route.query.token;
  if (typeof raw === "string" && raw.length > 0) {
    return raw;
  }
  if (import.meta.client) {
    const fromUrl = readTokenFromBrowserSnapshot();
    if (fromUrl && fromUrl.length > 0) {
      return fromUrl;
    }
  }
  if (initialBrowserToken && initialBrowserToken.length > 0) {
    return initialBrowserToken;
  }
  return null;
}

type ConfirmEmailViewState =
  | "missing_token"
  | "confirming"
  | "signed_in_success"
  | "confirmed_without_session"
  | "invalid_token"
  | "network_error"
  | "unexpected_error";

type SignedInConfirmEmailResult = Extract<ConfirmEmailResult, { kind: "signed_in" }>;

const viewState = ref<ConfirmEmailViewState>("confirming");

/**
 * Hydrates the session store with the canonical v3 user from the response
 * and triggers the soft redirect into the app.
 *
 * @param result Response payload from `useConfirmEmailMutation`.
 */
const completeSignIn = (result: SignedInConfirmEmailResult): void => {
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

/**
 * Classifies confirmation failures so the UI can offer the right recovery
 * action instead of collapsing every problem into a generic error.
 *
 * @param error Unknown thrown value from the confirmation mutation.
 * @returns Stable view state for the failed confirmation.
 */
function classifyFailure(error: unknown): Extract<ConfirmEmailViewState, "invalid_token" | "network_error" | "unexpected_error"> {
  if (!(error instanceof ApiError)) {
    return "unexpected_error";
  }
  const code = error.code?.toLowerCase() ?? "";
  const message = error.message.toLowerCase();
  if ([400, 404, 410].includes(error.status) || code.includes("token")) {
    return "invalid_token";
  }
  if (
    code === "econnaborted" ||
    message.includes("network") ||
    message.includes("timeout")
  ) {
    return "network_error";
  }
  return "unexpected_error";
}

/**
 * Emits a token-safe analytics event for the confirmation flow.
 *
 * @param outcome Stable outcome label.
 * @param error Optional failure used for non-sensitive diagnostics.
 */
function trackConfirmation(
  outcome: "started" | "signed_in" | "confirmed_without_session" | "invalid_token" | "network_error" | "unexpected_error",
  error?: unknown,
): void {
  const safeError =
    error instanceof ApiError
      ? { code: error.code ?? null, status: error.status }
      : undefined;
  analytics.capture("email_confirmation_completed", {
    outcome,
    ...(safeError ? { error: safeError } : {}),
  });
}

/**
 * Confirms the current URL token and maps every known result to a terminal UI
 * state. The token itself is only sent to the API and is never logged or
 * attached to analytics properties.
 */
async function confirmCurrentToken(): Promise<void> {
  const currentToken = readConfirmationToken();
  if (!currentToken) {
    viewState.value = "missing_token";
    return;
  }
  viewState.value = "confirming";
  trackConfirmation("started");
  try {
    const result = await mutation.mutateAsync(currentToken);
    if (result.kind === "signed_in") {
      completeSignIn(result);
      viewState.value = "signed_in_success";
      trackConfirmation("signed_in");
      // Tiny micro-celebration before bouncing into the app. 800ms is enough
      // for the user to register that something happened ("Email confirmado!")
      // without feeling like a delay.
      setTimeout(() => {
        void router.push("/dashboard");
      }, 800);
      return;
    }
    viewState.value = "confirmed_without_session";
    trackConfirmation("confirmed_without_session");
  } catch (error) {
    viewState.value = classifyFailure(error);
    trackConfirmation(viewState.value, error);
  }
}

onMounted(() => {
  void confirmCurrentToken();
});

const status = computed((): ConfirmEmailViewState => {
  if (mutation.isPending.value) { return "confirming"; }
  return viewState.value;
});
</script>

<template>
  <div class="confirm-email">
    <div class="confirm-email__card">
      <!-- Loading -->
      <template v-if="status === 'confirming'">
        <NSpin :size="48" />
        <h1>{{ $t('pages.confirmEmail.confirming') }}</h1>
        <p>{{ $t('pages.confirmEmail.wait') }}</p>
      </template>

      <!-- Success (800ms before auto-redirect) -->
      <template v-else-if="status === 'signed_in_success'">
        <CheckCircle2 class="confirm-email__icon confirm-email__icon--success" :size="64" />
        <h1>{{ $t('pages.confirmEmail.successTitle') }}</h1>
        <p>{{ $t('pages.confirmEmail.successDescription') }}</p>
      </template>

      <!-- Success without a magic-link session -->
      <template v-else-if="status === 'confirmed_without_session'">
        <CheckCircle2 class="confirm-email__icon confirm-email__icon--success" :size="64" />
        <h1>{{ $t('pages.confirmEmail.successWithoutSessionTitle') }}</h1>
        <p>{{ $t('pages.confirmEmail.successWithoutSessionDescription') }}</p>
        <NButton type="primary" tag="a" href="/login">
          {{ $t('pages.confirmEmail.loginCta') }}
        </NButton>
      </template>

      <!-- Error: expired / invalid / reused token -->
      <template v-else-if="status === 'invalid_token'">
        <XCircle class="confirm-email__icon confirm-email__icon--error" :size="64" />
        <h1>{{ $t('pages.confirmEmail.invalidTitle') }}</h1>
        <p>{{ $t('pages.confirmEmail.invalidDescription') }}</p>
        <NButton type="primary" tag="a" href="/resend-confirmation">
          {{ $t('pages.confirmEmail.resendCta') }}
        </NButton>
      </template>

      <!-- Network/timeout: retry without forcing a new email -->
      <template v-else-if="status === 'network_error'">
        <XCircle class="confirm-email__icon confirm-email__icon--error" :size="64" />
        <h1>{{ $t('pages.confirmEmail.networkTitle') }}</h1>
        <p>{{ $t('pages.confirmEmail.networkDescription') }}</p>
        <NButton
          type="primary"
          data-testid="confirm-email-retry"
          :disabled="mutation.isPending.value"
          @click="confirmCurrentToken"
        >
          {{ $t('pages.confirmEmail.retryCta') }}
        </NButton>
      </template>

      <!-- Unexpected response: recover safely -->
      <template v-else-if="status === 'unexpected_error'">
        <XCircle class="confirm-email__icon confirm-email__icon--error" :size="64" />
        <h1>{{ $t('pages.confirmEmail.unexpectedTitle') }}</h1>
        <p>{{ $t('pages.confirmEmail.unexpectedDescription') }}</p>
        <NButton type="default" tag="a" href="/login">
          {{ $t('pages.confirmEmail.loginCta') }}
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
