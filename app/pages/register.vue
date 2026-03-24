<script setup lang="ts">
import axios from "axios";
import { useMessage } from "naive-ui";
import { useRegisterMutation } from "~/composables/useAuth";
import { useAuthRedirectContext } from "~/composables/useAuthRedirectContext";
import { SignupForm } from "~/features/auth/components/SignupForm";
import type { RegisterSchema } from "~/schemas/auth";

definePageMeta({ layout: "auth", middleware: ["guest-only"] });

const message = useMessage();
const registerMutation = useRegisterMutation();
const { consumeRedirect } = useAuthRedirectContext();

/**
 * Submete o registro de novo usuário e redireciona ao destino pós-auth.
 * @param values - Dados validados do formulário de registro.
 */
const onSubmit = async (values: RegisterSchema): Promise<void> => {
  try {
    await registerMutation.mutateAsync(values);
    const redirect = consumeRedirect();
    await navigateTo(redirect);
  } catch (err) {
    const msg = axios.isAxiosError(err)
      ? (err.response?.data?.message ?? "Não foi possível criar a conta. Verifique os dados e tente novamente.")
      : "Ocorreu um erro inesperado. Tente novamente.";
    message.error(msg, { duration: 5000 });
  }
};
</script>

<template>
  <SignupForm :loading="registerMutation.isPending.value" @submit="onSubmit" />
</template>
