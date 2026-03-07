<script setup lang="ts">
import {
  useRegisterForm,
  useRegisterMutation,
} from "~/composables/useAuth";
import type { RegisterSchema } from "~/schemas/auth";

definePageMeta({ middleware: ["guest-only"] });

const registerMutation = useRegisterMutation();
const { defineField, errors, handleSubmit, isSubmitting } = useRegisterForm();
const [email, emailProps] = defineField("email");
const [password, passwordProps] = defineField("password");
const [confirmPassword, confirmPasswordProps] = defineField("confirmPassword");

const submit = handleSubmit(async (values: RegisterSchema) => {
  await registerMutation.mutateAsync(values);
  await navigateTo("/dashboard");
});
</script>

<template>
  <UiBaseCard title="Registrar">
    <form class="auth-form" @submit.prevent="submit">
      <label>
        E-mail
        <input v-model="email" type="email" autocomplete="email" v-bind="emailProps" >
      </label>
      <p class="form-error">{{ errors.email }}</p>

      <label>
        Senha
        <input
          v-model="password"
          type="password"
          autocomplete="new-password"
          v-bind="passwordProps"
        >
      </label>
      <p class="form-error">{{ errors.password }}</p>

      <label>
        Confirmar senha
        <input
          v-model="confirmPassword"
          type="password"
          autocomplete="new-password"
          v-bind="confirmPasswordProps"
        >
      </label>
      <p class="form-error">{{ errors.confirmPassword }}</p>

      <button type="submit" :disabled="isSubmitting || registerMutation.isPending.value">
        Registrar
      </button>

      <NuxtLink to="/login">Já tem uma conta?</NuxtLink>
    </form>
  </UiBaseCard>
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
  font-weight: var(--font-weight-semibold);
}

.auth-form input {
  border: 1px solid var(--color-outline-soft);
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
  font-weight: var(--font-weight-bold);
}

.form-error {
  min-height: 20px;
  color: var(--color-neutral-950);
  margin: 0;
}
</style>
