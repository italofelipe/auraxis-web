<script setup lang="ts">
import { useLoginForm } from "~/composables/useAuth";
import { useSocialLogin } from "~/features/auth/composables/useSocialLogin";
import type { LoginSchema } from "~/schemas/auth";
import type { LoginFormProps, LoginFormEmits } from "./LoginForm.types";

const { t } = useI18n();
const social = useSocialLogin();

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
        <label class="auth-card__remember" for="login-remember">
          <input id="login-remember" type="checkbox" :disabled="isPending">
          <span>{{ t('auth.login.rememberMe') }}</span>
        </label>
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

    <UiSocialAuthButtons
      v-if="social.isEnabled.value"
      class="auth-card__social"
      :disabled="isPending"
      @google-click="social.initiate('google')"
      @facebook-click="social.initiate('facebook')"
    />

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
  border-radius: var(--radius-lg);
  padding: 32px;
}

.glass {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-outline-soft);
  box-shadow: var(--shadow-card-lg, 0 22px 50px rgba(13, 40, 64, 0.12));
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
  background: var(--color-bg-elevated);
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
  border-color: var(--color-outline-hard);
}

.auth-card__input:focus {
  outline: none;
  border-color: var(--color-brand-500);
  box-shadow: 0 0 0 3px var(--color-brand-glow-sm);
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
  justify-content: space-between;
  gap: var(--space-4);
}

.auth-card__remember {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.auth-card__remember input {
  accent-color: var(--color-brand-500);
}

.auth-card__link {
  color: var(--color-brand-500);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
  text-decoration: none;
  transition: color 140ms ease;
}

.auth-card__link:hover {
  color: var(--color-positive);
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
  background: var(--gradient-brand);
  box-shadow: var(--shadow-brand-glow);
  color: var(--color-text-on-brand);
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
  border: 2px solid color-mix(in srgb, currentColor 24%, transparent);
  border-top-color: currentColor;
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
