<script setup lang="ts">
import { ArrowRight, ShieldCheck } from "lucide-vue-next";
import { useResetPasswordForm } from "~/composables/useAuth";
import type { ResetPasswordSchema } from "~/schemas/auth";
import type { ResetPasswordFormProps, ResetPasswordFormEmits } from "./ResetPasswordForm.types";

const props = withDefaults(defineProps<ResetPasswordFormProps>(), {
  loading: false,
  serverError: null,
});

const emit = defineEmits<ResetPasswordFormEmits>();

const { defineField, errors, handleSubmit, isSubmitting } = useResetPasswordForm();
const [password, passwordAttrs] = defineField("password");
const [confirmPassword, confirmPasswordAttrs] = defineField("confirmPassword");

const onSubmit = handleSubmit((values: ResetPasswordSchema) => {
  emit("submit", { password: values.password });
});

const isPending = computed(() => props.loading || isSubmitting.value);
</script>

<template>
  <div class="reset-form glass">
    <div class="reset-form__header">
      <div class="reset-form__icon" aria-hidden="true">
        <ShieldCheck :size="22" />
      </div>
      <h1 class="reset-form__title">{{ $t('auth.resetPassword.title') }}</h1>
      <p class="reset-form__subtitle">
        {{ $t('auth.resetPassword.subtitle') }}
      </p>
    </div>

    <form class="reset-form__fields" novalidate @submit.prevent="onSubmit">
      <div class="reset-form__password-block">
        <UiPasswordField
          v-model="password"
          :label="$t('auth.resetPassword.newPassword')"
          :placeholder="$t('auth.resetPassword.newPasswordPlaceholder')"
          field-id="reset-password"
          :error="errors.password"
          :disabled="isPending"
          autocomplete="new-password"
          required
          v-bind="passwordAttrs"
        />
        <PasswordStrengthMeter :password="password ?? ''" />
      </div>

      <UiPasswordField
        v-model="confirmPassword"
        :label="$t('auth.resetPassword.confirmPassword')"
        :placeholder="$t('auth.resetPassword.confirmPasswordPlaceholder')"
        field-id="reset-confirm-password"
        :error="errors.confirmPassword"
        :disabled="isPending"
        autocomplete="new-password"
        required
        v-bind="confirmPasswordAttrs"
      />

      <p v-if="props.serverError" class="reset-form__server-error" role="alert">
        {{ props.serverError }}
      </p>

      <div class="reset-form__cta">
        <button
          type="submit"
          class="reset-form__submit"
          :disabled="isPending"
          :aria-busy="isPending"
        >
          <span v-if="isPending" class="reset-form__spinner" aria-hidden="true" />
          {{ isPending ? $t('auth.resetPassword.submitting') : $t('auth.resetPassword.submit') }}
          <ArrowRight v-if="!isPending" class="reset-form__submit-icon" :size="17" aria-hidden="true" />
        </button>
        <p class="reset-form__cta-hint">{{ $t('auth.resetPassword.ctaHint') }}</p>
      </div>
    </form>

    <div class="reset-form__links">
      <NuxtLink to="/login" class="reset-form__link">
        {{ $t('auth.resetPassword.backToLogin') }}
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.reset-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
  max-width: 440px;
  margin-inline: auto;
  padding: var(--space-7);
  border-radius: var(--radius-xl);
}

/* Mesmo recorte de vidro usado em login, registro e recuperação. Duplicado de
   propósito: extrair para utilitário global mexeria no CSS scoped de três telas
   críticas dentro de um PR que já é de redesign. */
.glass {
  background: linear-gradient(175deg, var(--color-bg-glass), var(--color-bg-surface));
  border: 1px solid var(--color-outline-soft);
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(8px);
}

.reset-form__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.reset-form__icon {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  margin-bottom: var(--space-3);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  color: var(--color-brand-500);
}

.reset-form__title {
  font-size: clamp(var(--font-size-2xl), 3vw, var(--font-size-4xl));
  line-height: var(--line-height-heading-lg);
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

.reset-form__fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.reset-form__password-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.reset-form__server-error {
  font-size: var(--font-size-sm);
  color: var(--color-negative);
  margin: 0;
}

.reset-form__cta {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.reset-form__submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: 44px;
  width: 100%;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--gradient-brand);
  box-shadow: var(--shadow-brand-glow);
  color: var(--color-text-on-brand);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-body);
  cursor: pointer;
  transition: transform 220ms ease, filter 220ms ease;
}

.reset-form__submit-icon {
  transition: transform 220ms ease;
}

.reset-form__submit:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.03);
}

.reset-form__submit:hover:not(:disabled) .reset-form__submit-icon {
  transform: translateX(3px);
}

.reset-form__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.reset-form__cta-hint {
  margin: 0;
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.reset-form__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid color-mix(in srgb, currentColor 24%, transparent);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.reset-form__links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-outline-subtle);
  font-size: var(--font-size-sm);
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
</style>
