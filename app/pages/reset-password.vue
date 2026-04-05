<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { useField, useForm } from "vee-validate";
import { useResetPasswordMutation } from "~/composables/useAuth";
import { useApiError } from "~/composables/useApiError";
import { resetPasswordSchema } from "~/schemas/auth";

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

const { handleSubmit, isSubmitting, errors } = useForm({
  validationSchema: toTypedSchema(resetPasswordSchema),
  initialValues: { password: "", confirmPassword: "" },
});

const { value: password } = useField<string>("password");
const { value: confirmPassword } = useField<string>("confirmPassword");

/**
 * Submits the new password to the API using the token from the URL query string.
 *
 * @param values - Validated form values with password and confirmPassword.
 */
const onSubmit = handleSubmit(async (values) => {
  if (!token.value) { return; }
  serverError.value = null;
  try {
    await resetMutation.mutateAsync({ token: token.value, password: values.password });
    isSuccess.value = true;
    setTimeout(() => { navigateTo("/login"); }, 2000);
  } catch (err) {
    serverError.value = getErrorMessage(err);
  }
});

const isPending = computed(() => resetMutation.isPending.value || isSubmitting.value);
</script>

<template>
  <div class="reset-form">
    <!-- No token state -->
    <template v-if="!token">
      <div class="reset-form__header">
        <h1 class="reset-form__title">{{ $t('auth.resetPassword.title') }}</h1>
        <p class="reset-form__subtitle reset-form__subtitle--error">
          {{ $t('auth.resetPassword.noToken') }}
        </p>
      </div>
      <NuxtLink to="/forgot-password" class="reset-form__link">
        {{ $t('auth.resetPassword.requestNew') }}
      </NuxtLink>
      <NuxtLink to="/login" class="reset-form__back-link">
        {{ $t('auth.resetPassword.backToLogin') }}
      </NuxtLink>
    </template>

    <!-- Success state -->
    <template v-else-if="isSuccess">
      <div class="reset-form__success">
        <h1 class="reset-form__title">{{ $t('auth.resetPassword.success') }}</h1>
        <p class="reset-form__subtitle">{{ $t('auth.resetPassword.successSubtitle') }}</p>
        <NuxtLink to="/login" class="reset-form__back-link">
          {{ $t('auth.resetPassword.backToLogin') }}
        </NuxtLink>
      </div>
    </template>

    <!-- Form state -->
    <template v-else>
      <div class="reset-form__header">
        <h1 class="reset-form__title">{{ $t('auth.resetPassword.title') }}</h1>
        <p class="reset-form__subtitle">{{ $t('auth.resetPassword.subtitle') }}</p>
      </div>

      <form class="reset-form__fields" novalidate @submit.prevent="onSubmit">
        <UiFormField
          :label="$t('auth.resetPassword.newPassword')"
          field-id="reset-password"
          :error="errors.password"
          required
        >
          <input
            id="reset-password"
            v-model="password"
            class="reset-form__input"
            :class="{ 'reset-form__input--error': !!errors.password }"
            type="password"
            autocomplete="new-password"
            :disabled="isPending"
          >
        </UiFormField>

        <UiFormField
          :label="$t('auth.resetPassword.confirmPassword')"
          field-id="reset-confirm-password"
          :error="errors.confirmPassword"
          required
        >
          <input
            id="reset-confirm-password"
            v-model="confirmPassword"
            class="reset-form__input"
            :class="{ 'reset-form__input--error': !!errors.confirmPassword }"
            type="password"
            autocomplete="new-password"
            :disabled="isPending"
          >
        </UiFormField>

        <p v-if="serverError" class="reset-form__server-error" role="alert">
          {{ serverError }}
        </p>

        <button
          type="submit"
          class="reset-form__submit"
          :disabled="isPending"
          :aria-busy="isPending"
        >
          <span v-if="isPending" class="reset-form__spinner" aria-hidden="true" />
          {{ isPending ? $t('auth.resetPassword.submitting') : $t('auth.resetPassword.submit') }}
        </button>
      </form>

      <NuxtLink to="/login" class="reset-form__back-link">
        {{ $t('auth.resetPassword.backToLogin') }}
      </NuxtLink>
    </template>
  </div>
</template>

<style scoped>
.reset-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
  max-width: 400px;
}

.reset-form__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.reset-form__title {
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-md);
  line-height: var(--line-height-heading-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.reset-form__subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: var(--line-height-md);
}

.reset-form__subtitle--error {
  color: var(--color-negative);
}

.reset-form__fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.reset-form__input {
  width: 100%;
  padding: 10px var(--space-2);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  font-family: var(--font-body);
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  box-sizing: border-box;
}

.reset-form__input::placeholder {
  color: var(--color-text-subtle);
}

.reset-form__input:focus {
  border-color: var(--color-brand-600);
  box-shadow: 0 0 0 2px var(--color-brand-glow-xs);
}

.reset-form__input--error {
  border-color: var(--color-negative);
}

.reset-form__input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reset-form__server-error {
  font-size: var(--font-size-sm);
  color: var(--color-negative);
  margin: 0;
}

.reset-form__submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 48px;
  width: 100%;
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-brand-500);
  color: var(--color-neutral-950);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-body);
  cursor: pointer;
  transition: background 0.15s ease, opacity 0.15s ease;
}

.reset-form__submit:hover:not(:disabled) {
  background: var(--color-brand-400);
}

.reset-form__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.reset-form__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-top-color: var(--color-neutral-950);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.reset-form__link {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-brand-400);
  text-decoration: none;
  transition: color 0.15s ease;
}

.reset-form__link:hover {
  color: var(--color-brand-300);
  text-decoration: underline;
}

.reset-form__back-link {
  text-align: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-brand-400);
  text-decoration: none;
  transition: color 0.15s ease;
}

.reset-form__back-link:hover {
  color: var(--color-brand-300);
  text-decoration: underline;
}

.reset-form__success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  text-align: center;
  padding: var(--space-4) 0;
}
</style>
