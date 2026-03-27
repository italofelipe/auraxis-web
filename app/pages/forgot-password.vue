<script setup lang="ts">
import { ref } from "vue";
import { useForgotPasswordMutation } from "~/composables/useAuth";
import { ForgotPasswordForm } from "~/features/auth/components/ForgotPasswordForm";
import type { ForgotPasswordSchema } from "~/schemas/auth";

definePageMeta({ layout: "auth", middleware: ["guest-only"] });

const { t } = useI18n();
useSeoMeta({ description: t("auth.forgotPassword.metaDescription") });

const forgotPasswordMutation = useForgotPasswordMutation();
const emailSent = ref(false);

/**
 * Solicita o envio do e-mail de recuperação de senha.
 * @param values - Dados validados com o e-mail do usuário.
 */
const onSubmit = async (values: ForgotPasswordSchema): Promise<void> => {
  await forgotPasswordMutation.mutateAsync(values);
  emailSent.value = true;
};
</script>

<template>
  <ForgotPasswordForm
    :loading="forgotPasswordMutation.isPending.value"
    :success="emailSent"
    @submit="onSubmit"
  />
</template>
