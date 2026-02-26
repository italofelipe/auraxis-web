<script setup lang="ts">
import {
  useLoginForm,
  useLoginMutation,
} from "~/composables/useAuth";
import type { LoginSchema } from "~/schemas/auth";

definePageMeta({ middleware: ["guest-only"] });

const loginMutation = useLoginMutation();
const { defineField, errors, handleSubmit, isSubmitting } = useLoginForm();
const [email, emailProps] = defineField("email");
const [password, passwordProps] = defineField("password");

const submit = handleSubmit(async (values: LoginSchema) => {
  await loginMutation.mutateAsync(values);
  await navigateTo("/dashboard");
});
</script>

<template>
  <BaseCard title="Entrar">
    <form class="auth-form" @submit.prevent="submit">
      <label>
        E-mail
        <input v-model="email" type="email" autocomplete="email" v-bind="emailProps">
      </label>
      <p class="form-error">{{ errors.email }}</p>

      <label>
        Senha
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          v-bind="passwordProps"
        >
      </label>
      <p class="form-error">{{ errors.password }}</p>

      <button type="submit" :disabled="isSubmitting || loginMutation.isPending.value">
        Entrar
      </button>

      <NuxtLink to="/forgot-password">Esqueceu sua senha?</NuxtLink>
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
