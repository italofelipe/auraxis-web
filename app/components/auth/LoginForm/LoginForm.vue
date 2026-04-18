<script setup lang="ts">
import { useLoginForm } from "~/composables/useAuth";
import type { LoginSchema } from "~/schemas/auth";
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
  <div class="auth-card glass">
    <h1 class="auth-card__title">{{ t('auth.login.title') }}</h1>
    <p class="auth-card__subtitle">{{ t('auth.login.subtitle') }}</p>

    <form class="auth-card__form" novalidate @submit.prevent="onSubmit">
      <UiFormField
        :label="t('auth.login.emailLabel')"
        field-id="login-email"
        :error="errors.email"
        required
      >
        <input
          id="login-email"
          v-model="email"
          class="auth-card__input"
          :class="{ 'auth-card__input--error': !!errors.email }"
          type="email"
          :placeholder="t('auth.login.emailPlaceholder')"
          autocomplete="email"
          :disabled="isPending"
          v-bind="emailAttrs"
        >
      </UiFormField>

      <UiPasswordField
        v-model="password"
        :label="t('auth.login.passwordLabel')"
        :placeholder="t('auth.login.passwordPlaceholder')"
        field-id="login-password"
        :error="errors.password"
        :disabled="isPending"
        autocomplete="current-password"
        required
        v-bind="passwordAttrs"
      />

      <div class="auth-card__inline-row">
        <NuxtLink to="/forgot-password" class="auth-card__link">
          {{ t('auth.login.forgotPassword') }}
        </NuxtLink>
      </div>

      <button
        type="submit"
        class="auth-card__submit"
        :disabled="isPending"
        :aria-busy="isPending"
      >
        <span v-if="isPending" class="auth-card__spinner" aria-hidden="true" />
        {{ isPending ? t('auth.login.submitLoading') : t('auth.login.submit') }}
      </button>
    </form>

    <div class="auth-card__divider"><span>{{ t('auth.login.divider') }}</span></div>

    <p class="auth-card__footer">
      {{ t('auth.login.noAccount') }}
      <NuxtLink to="/register" class="auth-card__link">
        {{ t('auth.login.createAccount') }}
      </NuxtLink>
    </p>
  </div>
</template>

<style scoped>
.auth-card {
  border-radius: var(--radius-xl, 28px);
  padding: var(--space-7);
}

.glass {
  background: linear-gradient(175deg, rgba(18, 26, 42, 0.86), rgba(10, 15, 26, 0.92));
  border: 1px solid var(--color-outline-soft);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(8px);
}

.auth-card__title {
  font-size: clamp(var(--font-size-2xl), 3vw, var(--font-size-4xl));
  font-weight: var(--font-weight-bold);
  letter-spacing: -0.01em;
  margin: 0 0 var(--space-2) 0;
}

.auth-card__subtitle {
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-5) 0;
}

.auth-card__form {
  display: grid;
  gap: var(--space-4);
}

.auth-card__input {
  width: 100%;
  height: 44px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-outline-soft);
  background: rgba(5, 7, 13, 0.75);
  color: var(--color-text-primary);
  padding: 0 12px;
  font: inherit;
  transition: border-color 140ms ease, box-shadow 140ms ease;
  box-sizing: border-box;
}

.auth-card__input::placeholder {
  color: var(--color-text-muted);
}

.auth-card__input:hover {
  border-color: rgba(255, 255, 255, 0.2);
}

.auth-card__input:focus {
  outline: none;
  border-color: var(--accent-cyan, #44d4ff);
  box-shadow: 0 0 0 3px rgba(68, 212, 255, 0.18);
}

.auth-card__input--error {
  border-color: var(--color-negative);
}

.auth-card__input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auth-card__inline-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-4);
}

.auth-card__link {
  color: var(--accent-cyan, #44d4ff);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
  text-decoration: none;
  transition: color 140ms ease;
}

.auth-card__link:hover {
  color: var(--accent-lime, #42e8a9);
}

.auth-card__submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: 44px;
  width: 100%;
  border: none;
  border-radius: var(--radius-full);
  background: linear-gradient(140deg, #44d4ff, #42e8a9);
  box-shadow: 0 18px 44px rgba(68, 212, 255, 0.24);
  color: #051220;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-body);
  cursor: pointer;
  transition: transform 220ms ease, filter 220ms ease;
}

.auth-card__submit:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.03);
}

.auth-card__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-card__spinner {
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

.auth-card__divider {
  margin: var(--space-5) 0;
  border-top: 1px solid var(--color-outline-soft);
  position: relative;
}

.auth-card__divider span {
  position: absolute;
  top: -9px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-bg-surface);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  padding: 0 var(--space-2);
}

.auth-card__footer {
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}
</style>
