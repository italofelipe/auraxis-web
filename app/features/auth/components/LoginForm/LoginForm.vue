<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useLoginForm } from "~/composables/useAuth";
import type { LoginSchema } from "~/schemas/auth";
import UiFormField from "~/shared/components/UiFormField/UiFormField.vue";
import UiPasswordField from "~/shared/components/UiPasswordField/UiPasswordField.vue";
import UiSocialAuthButtons from "~/shared/components/UiSocialAuthButtons/UiSocialAuthButtons.vue";
import type { LoginFormProps, LoginFormEmits } from "./LoginForm.types";

const { t } = useI18n();

const props = withDefaults(defineProps<LoginFormProps>(), {
  loading: false,
});

const emit = defineEmits<LoginFormEmits>();

const { defineField, errors, handleSubmit, isSubmitting } = useLoginForm();
const [email, emailAttrs] = defineField("email");
const [password, passwordAttrs] = defineField("password");

const onSubmit = handleSubmit((values: LoginSchema) => {
  emit("submit", values);
});

const isPending = computed(() => props.loading || isSubmitting.value);
</script>

<template>
  <div class="login-form">
    <div class="login-form__header">
      <h1 class="login-form__title">{{ t('auth.login.title') }}</h1>
      <p class="login-form__subtitle">{{ t('auth.login.subtitle') }}</p>
    </div>

    <UiSocialAuthButtons class="login-form__social" />

    <div class="login-form__divider" aria-hidden="true">
      <span class="login-form__divider-text">{{ t('auth.login.divider') }}</span>
    </div>

    <form class="login-form__fields" novalidate @submit.prevent="onSubmit">
      <UiFormField
        :label="t('auth.login.emailLabel')"
        field-id="login-email"
        :error="errors.email"
        required
      >
        <input
          id="login-email"
          v-model="email"
          class="login-form__input"
          :class="{ 'login-form__input--error': !!errors.email }"
          type="email"
          :placeholder="t('auth.login.emailPlaceholder')"
          autocomplete="email"
          :disabled="isPending"
          v-bind="emailAttrs"
        >
      </UiFormField>

      <UiPasswordField
        v-model="password"
        field-id="login-password"
        :error="errors.password"
        :disabled="isPending"
        autocomplete="current-password"
        required
        v-bind="passwordAttrs"
      />

      <div class="login-form__forgot">
        <NuxtLink to="/forgot-password" class="login-form__link">
          {{ t('auth.login.forgotPassword') }}
        </NuxtLink>
      </div>

      <button
        type="submit"
        class="login-form__submit"
        :disabled="isPending"
        :aria-busy="isPending"
      >
        <span v-if="isPending" class="login-form__spinner" aria-hidden="true" />
        {{ isPending ? t('auth.login.submitLoading') : t('auth.login.submit') }}
      </button>
    </form>

    <p class="login-form__register">
      {{ t('auth.login.noAccount') }}
      <NuxtLink to="/register" class="login-form__link">
        {{ t('auth.login.createAccount') }}
      </NuxtLink>
    </p>
  </div>
</template>

<style scoped>
.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
  max-width: 400px;
}

.login-form__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.login-form__title {
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-md);
  line-height: var(--line-height-heading-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.login-form__subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.login-form__social {
  width: 100%;
}

.login-form__divider {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.login-form__divider::before,
.login-form__divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--color-outline-soft);
}

.login-form__divider-text {
  white-space: nowrap;
  padding: 0 var(--space-1);
}

.login-form__fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.login-form__input {
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

.login-form__input::placeholder {
  color: var(--color-text-subtle);
}

.login-form__input:focus {
  border-color: var(--color-brand-600);
  box-shadow: 0 0 0 2px var(--color-brand-glow-xs);
}

.login-form__input--error {
  border-color: var(--color-negative);
}

.login-form__input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-form__forgot {
  display: flex;
  justify-content: flex-end;
  margin-top: calc(var(--space-1) * -1);
}

.login-form__link {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-brand-400);
  text-decoration: none;
  transition: color 0.15s ease;
}

.login-form__link:hover {
  color: var(--color-brand-300);
  text-decoration: underline;
}

.login-form__submit {
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

.login-form__submit:hover:not(:disabled) {
  background: var(--color-brand-400);
}

.login-form__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-form__spinner {
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

.login-form__register {
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}
</style>
