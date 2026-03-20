<script setup lang="ts">
import { useRegisterMutation } from "~/composables/useAuth";
import { useAuthRedirectContext } from "~/composables/useAuthRedirectContext";
import { SignupForm } from "~/features/auth/components/SignupForm";
import type { RegisterSchema } from "~/schemas/auth";

definePageMeta({ layout: "auth", middleware: ["guest-only"] });

const registerMutation = useRegisterMutation();
const { consumeRedirect } = useAuthRedirectContext();

/**
 * Submete o registro de novo usuário e redireciona ao destino pós-auth.
 * @param values - Dados validados do formulário de registro.
 */
const onSubmit = async (values: RegisterSchema): Promise<void> => {
  await registerMutation.mutateAsync(values);
  const redirect = consumeRedirect();
  await navigateTo(redirect);
};
</script>

<template>
  <SignupForm :loading="registerMutation.isPending.value" @submit="onSubmit" />
</template>
