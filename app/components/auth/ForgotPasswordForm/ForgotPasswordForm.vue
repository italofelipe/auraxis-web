<script setup lang="ts">
import { ArrowRight, KeyRound, Mail } from "lucide-vue-next";
import { useForgotPasswordForm } from "~/composables/useAuth";
import type { ForgotPasswordSchema } from "~/schemas/auth";
import type { ForgotPasswordFormProps, ForgotPasswordFormEmits } from "./ForgotPasswordForm.types";


const props = withDefaults(defineProps<ForgotPasswordFormProps>(), {
  loading: false,
  success: false,
});

const emit = defineEmits<ForgotPasswordFormEmits>();

const { defineField, errors, handleSubmit, isSubmitting } = useForgotPasswordForm();
const [email, emailAttrs] = defineField("email");

const onSubmit = handleSubmit((values: ForgotPasswordSchema) => {
  emit("submit", values);
});

const isPending = computed(() => props.loading || isSubmitting.value);
</script>

<template>
  <div class="forgot-form glass">
    <!-- Success state -->
    <template v-if="props.success">
      <div class="forgot-form__success">
        <IllustrationMailSent class="forgot-form__success-illustration" />
        <h1 class="forgot-form__title">{{ $t('auth.forgotPassword.successTitle') }}</h1>
        <p class="forgot-form__subtitle">
          {{ $t('auth.forgotPassword.successMessage') }}
        </p>
        <NuxtLink to="/login" class="forgot-form__back-link">
          {{ $t('auth.forgotPassword.backToLogin') }}
        </NuxtLink>
      </div>
    </template>

    <!-- Form state -->
    <template v-else>
      <div class="forgot-form__header">
        <div class="forgot-form__icon" aria-hidden="true">
          <KeyRound :size="22" />
        </div>
        <h1 class="forgot-form__title">{{ $t('auth.forgotPassword.title') }}</h1>
        <p class="forgot-form__subtitle">
          {{ $t('auth.forgotPassword.subtitle') }}
        </p>
      </div>

      <form class="forgot-form__fields" novalidate @submit.prevent="onSubmit">
        <UiFormField
          :label="$t('auth.forgotPassword.emailLabel')"
          field-id="forgot-email"
          :error="errors.email"
          required
        >
          <div class="forgot-form__input-wrap">
            <Mail :size="18" aria-hidden="true" />
            <input
              id="forgot-email"
              v-model="email"
              class="forgot-form__input"
              :class="{ 'forgot-form__input--error': !!errors.email }"
              type="email"
              :placeholder="$t('auth.forgotPassword.emailPlaceholder')"
              autocomplete="email"
              :disabled="isPending"
              v-bind="emailAttrs"
            >
          </div>
        </UiFormField>

        <button
          type="submit"
          class="forgot-form__submit"
          :disabled="isPending"
          :aria-busy="isPending"
        >
          <span v-if="isPending" class="forgot-form__spinner" aria-hidden="true" />
          {{ isPending ? $t('auth.forgotPassword.sending') : $t('auth.forgotPassword.sendLink') }}
          <ArrowRight v-if="!isPending" class="forgot-form__submit-icon" :size="17" aria-hidden="true" />
        </button>
      </form>

      <div class="forgot-form__links">
        <NuxtLink to="/login" class="forgot-form__link">
          {{ $t('auth.forgotPassword.backToLogin') }}
        </NuxtLink>
        <NuxtLink to="/register" class="forgot-form__link forgot-form__link--accent">
          Criar nova conta
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<style scoped>
.forgot-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
  max-width: 440px;
  margin-inline: auto;
  padding: var(--space-7);
  border-radius: var(--radius-xl, 28px);
}

.glass {
  background: linear-gradient(175deg, rgba(18, 26, 42, 0.86), rgba(10, 15, 26, 0.92));
  border: 1px solid var(--color-outline-soft);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(8px);
}

.forgot-form__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.forgot-form__icon {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  margin-bottom: var(--space-3);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-brand-500);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
}

.forgot-form__title {
  font-size: clamp(var(--font-size-2xl), 3vw, var(--font-size-4xl));
  line-height: var(--line-height-heading-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.forgot-form__subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: var(--line-height-md);
}

.forgot-form__fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.forgot-form__input-wrap {
  position: relative;
  color: var(--color-text-muted);
}

.forgot-form__input-wrap svg {
  position: absolute;
  top: 50%;
  left: 14px;
  transform: translateY(-50%);
  pointer-events: none;
}

.forgot-form__input {
  width: 100%;
  height: 44px;
  padding: 0 12px 0 44px;
  background: rgba(5, 7, 13, 0.75);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font: inherit;
  outline: none;
  transition: border-color 140ms ease, box-shadow 140ms ease;
  box-sizing: border-box;
}

.forgot-form__input::placeholder {
  color: var(--color-text-subtle);
}

.forgot-form__input:focus {
  border-color: var(--color-brand-500);
  box-shadow: 0 0 0 3px rgba(68, 212, 255, 0.18);
}

.forgot-form__input--error {
  border-color: var(--color-negative);
}

.forgot-form__input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.forgot-form__submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: 44px;
  width: 100%;
  border: none;
  border-radius: var(--radius-sm);
  background: linear-gradient(140deg, #44d4ff, #42e8a9);
  box-shadow: 0 18px 44px rgba(68, 212, 255, 0.24);
  color: #051220;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-body);
  cursor: pointer;
  transition: transform 220ms ease, filter 220ms ease;
}

.forgot-form__submit-icon {
  transition: transform 220ms ease;
}

.forgot-form__submit:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.03);
}

.forgot-form__submit:hover:not(:disabled) .forgot-form__submit-icon {
  transform: translateX(3px);
}

.forgot-form__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.forgot-form__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-top-color: #051220;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.forgot-form__link {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-brand-400);
  text-decoration: none;
  transition: color 0.15s ease;
}

.forgot-form__link:hover {
  color: var(--color-brand-300);
  text-decoration: underline;
}

.forgot-form__links {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding-top: var(--space-5);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  font-size: var(--font-size-sm);
}

.forgot-form__link--accent {
  color: var(--color-brand-500);
}

/* Success state */
.forgot-form__success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  text-align: center;
  padding: var(--space-4) 0;
}

.forgot-form__success-illustration {
  width: 100%;
  max-width: 260px;
  height: auto;
  margin-bottom: var(--space-2);
}

.forgot-form__back-link {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-brand-400);
  text-decoration: none;
  margin-top: var(--space-2);
  transition: color 0.15s ease;
}

.forgot-form__back-link:hover {
  color: var(--color-brand-300);
  text-decoration: underline;
}
</style>
