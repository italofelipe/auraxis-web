<script setup lang="ts">
import { useRegisterForm } from "~/composables/useAuth";
import type { RegisterSchema } from "~/schemas/auth";
import type { SignupFormProps, SignupFormEmits } from "./SignupForm.types";

const { t } = useI18n();

const props = withDefaults(defineProps<SignupFormProps>(), {
  loading: false,
});

const emit = defineEmits<SignupFormEmits>();

const { defineField, errors, handleSubmit, isSubmitting } = useRegisterForm();
const [name, nameAttrs] = defineField("name");
const [email, emailAttrs] = defineField("email");
const [password, passwordAttrs] = defineField("password");
const [confirmPassword, confirmPasswordAttrs] = defineField("confirmPassword");

const onSubmit = handleSubmit((values: RegisterSchema) => {
  emit("submit", values);
});

const isPending = computed(() => props.loading || isSubmitting.value);
</script>

<template>
  <div class="signup-form glass">
    <div class="signup-form__header">
      <h1 class="signup-form__title">{{ t('auth.register.title') }}</h1>
      <p class="signup-form__subtitle">{{ t('auth.register.subtitle') }}</p>
    </div>

    <form class="signup-form__fields" novalidate @submit.prevent="onSubmit">
      <UiFormField
        :label="t('auth.register.nameLabel')"
        field-id="signup-name"
        :error="errors.name"
        required
      >
        <input
          id="signup-name"
          v-model="name"
          class="signup-form__input"
          :class="{ 'signup-form__input--error': !!errors.name }"
          type="text"
          :placeholder="t('auth.register.namePlaceholder')"
          autocomplete="name"
          :disabled="isPending"
          v-bind="nameAttrs"
        >
      </UiFormField>

      <UiFormField
        :label="t('auth.register.emailLabel')"
        field-id="signup-email"
        :error="errors.email"
        required
      >
        <input
          id="signup-email"
          v-model="email"
          class="signup-form__input"
          :class="{ 'signup-form__input--error': !!errors.email }"
          type="email"
          :placeholder="t('auth.register.emailPlaceholder')"
          autocomplete="email"
          :disabled="isPending"
          v-bind="emailAttrs"
        >
      </UiFormField>

      <div class="signup-form__password-block">
        <UiPasswordField
          v-model="password"
          :label="t('auth.register.passwordLabel')"
          :placeholder="t('auth.register.passwordPlaceholder')"
          field-id="signup-password"
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
        :label="t('auth.register.confirmPasswordLabel')"
        :placeholder="t('auth.register.confirmPasswordPlaceholder')"
        field-id="signup-confirm-password"
        :error="errors.confirmPassword"
        :disabled="isPending"
        autocomplete="new-password"
        required
        v-bind="confirmPasswordAttrs"
      />

      <label class="signup-form__terms" for="signup-terms">
        <input id="signup-terms" type="checkbox" required :disabled="isPending">
        <span>Concordo com termos e privacidade.</span>
      </label>

      <button
        type="submit"
        class="signup-form__submit"
        :disabled="isPending"
        :aria-busy="isPending"
      >
        <span v-if="isPending" class="signup-form__spinner" aria-hidden="true" />
        {{ isPending ? t('auth.register.submitLoading') : t('auth.register.submit') }}
      </button>
    </form>

    <div class="signup-form__divider" aria-hidden="true">
      <span class="signup-form__divider-text">{{ t('auth.register.divider') }}</span>
    </div>

    <p class="signup-form__login">
      {{ t('auth.register.hasAccount') }}
      <NuxtLink to="/login" class="signup-form__link">
        {{ t('auth.register.signIn') }}
      </NuxtLink>
    </p>
  </div>
</template>

<style scoped>
.signup-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
  padding: var(--space-7);
  border-radius: var(--radius-xl, 28px);
}

.glass {
  background: linear-gradient(175deg, var(--color-bg-glass), var(--color-bg-surface));
  border: 1px solid var(--color-outline-soft);
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(8px);
}

.signup-form__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.signup-form__title {
  font-size: clamp(var(--font-size-2xl), 3vw, var(--font-size-4xl));
  line-height: var(--line-height-heading-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.signup-form__subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: var(--line-height-body-sm);
}

.signup-form__divider {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.signup-form__divider::before,
.signup-form__divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--color-outline-soft);
}

.signup-form__divider-text {
  white-space: nowrap;
  padding: 0 var(--space-1);
}

.signup-form__fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.signup-form__password-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.signup-form__input {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font: inherit;
  outline: none;
  transition: border-color 140ms ease, box-shadow 140ms ease;
  box-sizing: border-box;
}

.signup-form__input::placeholder {
  color: var(--color-text-subtle);
}

.signup-form__input:focus {
  border-color: var(--color-brand-500);
  box-shadow: 0 0 0 3px var(--color-brand-glow-sm);
}

.signup-form__input--error {
  border-color: var(--color-negative);
}

.signup-form__input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.signup-form__terms {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-body-sm);
}

.signup-form__terms input {
  accent-color: var(--color-brand-500);
}

.signup-form__submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: 44px;
  width: 100%;
  border: none;
  border-radius: var(--radius-full);
  background: var(--gradient-brand);
  box-shadow: var(--shadow-brand-glow);
  color: var(--color-text-on-brand);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-body);
  cursor: pointer;
  transition: transform 220ms ease, filter 220ms ease;
}

.signup-form__submit:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.03);
}

.signup-form__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.signup-form__spinner {
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

.signup-form__link {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding-block: 4px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-brand-400);
  text-decoration: none;
  transition: color 0.15s ease;
}

.signup-form__link:hover {
  color: var(--color-brand-300);
  text-decoration: underline;
}

.signup-form__login {
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}
</style>
