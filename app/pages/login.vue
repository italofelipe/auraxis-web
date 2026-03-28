<script setup lang="ts">
import axios from "axios";
import { useMessage } from "naive-ui";
import { useLoginMutation } from "~/composables/useAuth";
import { useAuthRedirectContext } from "~/composables/useAuthRedirectContext";
import type { LoginSchema } from "~/schemas/auth";

definePageMeta({ layout: "auth", middleware: ["guest-only"] });

const { t } = useI18n();
useSeoMeta({ description: t("auth.login.metaDescription") });

const message = useMessage();
const loginMutation = useLoginMutation();
const { consumeRedirect } = useAuthRedirectContext();

/**
 * Submete as credenciais de login e redireciona ao destino pós-auth.
 * @param values - Dados validados do formulário de login.
 */
const onSubmit = async (values: LoginSchema): Promise<void> => {
  try {
    await loginMutation.mutateAsync(values);
    // consumeRedirect returns the saved destination or "/dashboard" as fallback.
    // This preserves the "redirect to intended page after auth" pattern while
    // guaranteeing the user always lands on the Dashboard when there is no saved path.
    const redirect = consumeRedirect();
    await navigateTo(redirect || "/dashboard");
  } catch (err) {
    const msg = axios.isAxiosError(err)
      ? (err.response?.data?.message ?? "Credenciais inválidas. Verifique seu e-mail e senha.")
      : "Ocorreu um erro inesperado. Tente novamente.";
    message.error(msg, { duration: 5000 });
  }
};
</script>

<template>
  <LoginForm :loading="loginMutation.isPending.value" @submit="onSubmit" />
</template>
