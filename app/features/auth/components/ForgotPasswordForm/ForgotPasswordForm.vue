<script setup lang="ts">
import { useForgotPasswordForm } from "~/composables/useAuth";
import type { ForgotPasswordSchema } from "~/schemas/auth";
import UiFormField from "~/shared/components/UiFormField/UiFormField.vue";
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
  <div class="forgot-form">
    <!-- Success state -->
    <template v-if="props.success">
      <div class="forgot-form__success">
        <span class="forgot-form__success-icon" aria-hidden="true">📬</span>
        <h1 class="forgot-form__title">E-mail enviado</h1>
        <p class="forgot-form__subtitle">
          Se esse e-mail estiver cadastrado, você receberá um link de recuperação em instantes.
          Verifique também sua pasta de spam.
        </p>
        <NuxtLink to="/login" class="forgot-form__back-link">
          Voltar para o login
        </NuxtLink>
      </div>
    </template>

    <!-- Form state -->
    <template v-else>
      <div class="forgot-form__header">
        <h1 class="forgot-form__title">Recuperar senha</h1>
        <p class="forgot-form__subtitle">
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
        </p>
      </div>

      <form class="forgot-form__fields" novalidate @submit.prevent="onSubmit">
        <UiFormField
          label="E-mail"
          field-id="forgot-email"
          :error="errors.email"
          required
        >
          <input
            id="forgot-email"
            v-model="email"
            class="forgot-form__input"
            :class="{ 'forgot-form__input--error': !!errors.email }"
            type="email"
            placeholder="seu@email.com"
            autocomplete="email"
            :disabled="isPending"
            v-bind="emailAttrs"
          >
        </UiFormField>

        <button
          type="submit"
          class="forgot-form__submit"
          :disabled="isPending"
          :aria-busy="isPending"
        >
          <span v-if="isPending" class="forgot-form__spinner" aria-hidden="true" />
          {{ isPending ? "Enviando…" : "Enviar link de recuperação" }}
        </button>
      </form>

      <p class="forgot-form__login">
        Lembrou a senha?
        <NuxtLink to="/login" class="forgot-form__link">
          Voltar para o login
        </NuxtLink>
      </p>
    </template>
  </div>
</template>

<style scoped>
.forgot-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
  max-width: 400px;
}

.forgot-form__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.forgot-form__title {
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-md);
  line-height: var(--line-height-heading-md);
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
  gap: var(--space-3);
}

.forgot-form__input {
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

.forgot-form__input::placeholder {
  color: var(--color-text-subtle);
}

.forgot-form__input:focus {
  border-color: var(--color-brand-600);
  box-shadow: 0 0 0 2px var(--color-brand-glow-xs);
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

.forgot-form__submit:hover:not(:disabled) {
  background: var(--color-brand-400);
}

.forgot-form__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.forgot-form__spinner {
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

.forgot-form__login {
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
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

.forgot-form__success-icon {
  font-size: var(--font-size-4xl);
  line-height: 1;
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
