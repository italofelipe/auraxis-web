<script setup lang="ts">
import { useResetPasswordMutation } from "~/composables/useAuth";
import { useApiError } from "~/composables/useApiError";

definePageMeta({ layout: "auth", middleware: ["guest-only"] });

const { t } = useI18n();
useSeoMeta({
  title: t("auth.resetPassword.title"),
  description: t("auth.resetPassword.metaDescription"),
  robots: "noindex, nofollow",
});

const route = useRoute();
const token = computed(() => route.query.token as string | undefined);

const resetMutation = useResetPasswordMutation();
const { getErrorMessage } = useApiError();

const isSuccess = ref(false);
const serverError = ref<string | null>(null);

/**
 * Reads the field-level validation errors out of the v2 error envelope.
 *
 * @param err Unknown error thrown by the mutation.
 * @returns Field names the backend rejected.
 */
const rejectedFields = (err: unknown): readonly string[] => {
  const envelope = (err as { response?: { data?: { error?: { details?: { errors?: { json?: Record<string, unknown> } } } } } })
    ?.response?.data?.error?.details?.errors?.json;
  return envelope ? Object.keys(envelope) : [];
};

/**
 * Turns an API failure into the most specific message we can offer.
 *
 * A rejected `new_password` means the password broke the backend rules; a
 * rejected `token` (or a message mentioning it) means the link is spent. Only
 * when neither applies do we fall back to the generic handler.
 *
 * @param err Unknown error thrown by the mutation.
 * @returns Message to show the user.
 */
const resolveServerError = (err: unknown): string => {
  const fields = rejectedFields(err);
  if (fields.includes("new_password")) {
    return t("auth.resetPassword.errorPasswordRules");
  }
  if (fields.includes("token")) {
    return t("auth.resetPassword.errorExpired");
  }
  return getErrorMessage(err);
};

/**
 * Submits the new password to the API using the token from the URL query string.
 *
 * @param values Validated form values.
 * @param values.password The new password.
 */
const onSubmit = async (values: { password: string }): Promise<void> => {
  if (!token.value) { return; }
  serverError.value = null;
  try {
    await resetMutation.mutateAsync({ token: token.value, newPassword: values.password });
    isSuccess.value = true;
    setTimeout(() => { navigateTo("/login"); }, 2000);
  } catch (err) {
    serverError.value = resolveServerError(err);
  }
};
</script>

<template>
  <!-- No token state -->
  <div v-if="!token" class="reset-page glass">
    <h1 class="reset-page__title">{{ $t('auth.resetPassword.noToken') }}</h1>
    <p class="reset-page__text">{{ $t('auth.resetPassword.noTokenHint') }}</p>
    <NuxtLink to="/forgot-password" class="reset-page__cta">
      {{ $t('auth.resetPassword.requestNew') }}
    </NuxtLink>
    <NuxtLink to="/login" class="reset-page__link">
      {{ $t('auth.resetPassword.backToLogin') }}
    </NuxtLink>
  </div>

  <!-- Success state -->
  <div v-else-if="isSuccess" class="reset-page glass">
    <h1 class="reset-page__title">{{ $t('auth.resetPassword.success') }}</h1>
    <p class="reset-page__text">{{ $t('auth.resetPassword.successSubtitle') }}</p>
    <NuxtLink to="/login" class="reset-page__link">
      {{ $t('auth.resetPassword.backToLogin') }}
    </NuxtLink>
  </div>

  <!-- Form state -->
  <ResetPasswordForm
    v-else
    :loading="resetMutation.isPending.value"
    :server-error="serverError"
    @submit="onSubmit"
  />
</template>

<style scoped>
.reset-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-3);
  width: 100%;
  max-width: 440px;
  margin-inline: auto;
  padding: var(--space-7);
  border-radius: var(--radius-xl);
}

.glass {
  background: linear-gradient(175deg, var(--color-bg-glass), var(--color-bg-surface));
  border: 1px solid var(--color-outline-soft);
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(8px);
}

.reset-page__title {
  font-size: var(--font-size-2xl);
  line-height: var(--line-height-heading-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.reset-page__text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-md);
  margin: 0;
}

.reset-page__cta {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  width: 100%;
  margin-top: var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--gradient-brand);
  box-shadow: var(--shadow-brand-glow);
  color: var(--color-text-on-brand);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  text-decoration: none;
  transition: transform 220ms ease, filter 220ms ease;
}

.reset-page__cta:hover {
  transform: translateY(-1px);
  filter: brightness(1.03);
}

.reset-page__link {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-brand-400);
  text-decoration: none;
  transition: color 0.15s ease;
}

.reset-page__link:hover {
  color: var(--color-brand-300);
  text-decoration: underline;
}
</style>
