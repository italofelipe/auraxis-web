<script setup lang="ts">
import axios from "axios";
import { useMessage } from "naive-ui";
import { useRegisterMutation } from "~/composables/useAuth";
import { useAuthRedirectContext } from "~/composables/useAuthRedirectContext";
import type { RegisterSchema } from "~/schemas/auth";

definePageMeta({ layout: "auth", middleware: ["guest-only"] });

const { t } = useI18n();
useSeoMeta({
  title: t("auth.register.title"),
  description: t("auth.register.metaDescription"),
  robots: "noindex, nofollow",
});
const message = useMessage();
const registerMutation = useRegisterMutation();
const { consumeRedirect } = useAuthRedirectContext();

/**
 * Submete o registro de novo usuário e redireciona ao destino pós-auth.
 * @param values - Dados validados do formulário de registro.
 */
const onSubmit = async (values: RegisterSchema): Promise<void> => {
  const { confirmPassword: _discard, ...registerPayload } = values;
  try {
    await registerMutation.mutateAsync(registerPayload);
    // Clear any pending redirect so the user lands on the login page,
    // not on a protected route that would bounce back to login anyway.
    consumeRedirect();
    message.success(t("auth.register.successToast"), { duration: 4000 });
    await navigateTo("/login");
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
