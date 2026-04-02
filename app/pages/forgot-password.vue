<script setup lang="ts">
import { ref } from "vue";
import { useForgotPasswordMutation } from "~/composables/useAuth";
import type { ForgotPasswordSchema } from "~/schemas/auth";

definePageMeta({ layout: "auth", middleware: ["guest-only"] });

const { t } = useI18n();
useSeoMeta({
  title: t("auth.forgotPassword.title"),
  description: t("auth.forgotPassword.metaDescription"),
  robots: "noindex, nofollow",
});

const forgotPasswordMutation = useForgotPasswordMutation();
const emailSent = ref(false);
/** Guards against duplicate submissions during the async gap between vee-validate
 * clearing `isSubmitting` (synchronous emit) and `mutateAsync` setting `isPending`. */
const isProcessing = ref(false);

/**
 * Solicita o envio do e-mail de recuperação de senha.
 *
 * Always navigates to the success screen regardless of the API result:
 * this prevents email-enumeration attacks (user cannot tell whether the
 * address exists by observing whether an error appears).
 * The guard `isProcessing` closes the race-condition window that exists
 * between vee-validate resetting `isSubmitting` (synchronous) and
 * TanStack Query setting `isPending` (next microtask), which would
 * otherwise briefly re-enable the submit button.
 *
 * @param values - Dados validados com o e-mail do usuário.
 */
const onSubmit = async (values: ForgotPasswordSchema): Promise<void> => {
  if (isProcessing.value) {return;}
  isProcessing.value = true;
  try {
    await forgotPasswordMutation.mutateAsync(values);
  } catch {
    // Intentionally swallowed — success screen shown regardless to prevent
    // email enumeration. Backend errors (5xx) are already toasted globally.
  } finally {
    emailSent.value = true;
    isProcessing.value = false;
  }
};
</script>

<template>
  <ForgotPasswordForm
    :loading="forgotPasswordMutation.isPending.value || isProcessing"
    :success="emailSent"
    @submit="onSubmit"
  />
</template>
