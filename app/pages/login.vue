<script setup lang="ts">
import { useLoginMutation } from "~/composables/useAuth";
import { useAuthRedirectContext } from "~/composables/useAuthRedirectContext";
import { LoginForm } from "~/features/auth/components/LoginForm";
import type { LoginSchema } from "~/schemas/auth";

definePageMeta({ layout: "auth", middleware: ["guest-only"] });

const loginMutation = useLoginMutation();
const { consumeRedirect } = useAuthRedirectContext();

/**
 * Submete as credenciais de login e redireciona ao destino pós-auth.
 * @param values - Dados validados do formulário de login.
 */
const onSubmit = async (values: LoginSchema): Promise<void> => {
  await loginMutation.mutateAsync(values);
  const redirect = consumeRedirect();
  await navigateTo(redirect);
};
</script>

<template>
  <LoginForm :loading="loginMutation.isPending.value" @submit="onSubmit" />
</template>
