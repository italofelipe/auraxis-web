<script setup lang="ts">
import {
  useForgotPasswordForm,
  useForgotPasswordMutation,
} from "~/composables/useAuth";
import type { ForgotPasswordSchema } from "~/schemas/auth";

definePageMeta({ middleware: ["guest-only"] });

const forgotPasswordMutation = useForgotPasswordMutation();
const { defineField, errors, handleSubmit, isSubmitting } = useForgotPasswordForm();
const [email, emailProps] = defineField("email");

const submit = handleSubmit(async (values: ForgotPasswordSchema) => {
  await forgotPasswordMutation.mutateAsync(values);
});
</script>

<template>
  <BaseCard title="Recuperar senha">
    <form class="auth-form" @submit.prevent="submit">
      <label>
        E-mail
        <input v-model="email" type="email" autocomplete="email" v-bind="emailProps">
      </label>
      <p class="form-error">{{ errors.email }}</p>

      <button type="submit" :disabled="isSubmitting || forgotPasswordMutation.isPending.value">
        Enviar link de recuperacao
      </button>

      <NuxtLink to="/login">Voltar para login</NuxtLink>
    </form>
  </BaseCard>
</template>

<style scoped>
.auth-form {
  display: grid;
  gap: var(--space-2);
}

.auth-form label {
  display: grid;
  gap: var(--space-1);
  color: var(--color-neutral-700);
  font-weight: 600;
}

.auth-form input {
  border: 1px solid rgba(38, 33, 33, 0.2);
  border-radius: var(--radius-sm);
  padding: var(--space-1);
  min-height: 44px;
}

.auth-form button {
  min-height: 44px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-brand-500);
  color: var(--color-neutral-950);
  font-weight: 700;
}

.form-error {
  min-height: 20px;
  color: #bc2e2e;
  margin: 0;
}
</style>
