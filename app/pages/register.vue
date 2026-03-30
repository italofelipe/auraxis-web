<script setup lang="ts">
import axios from "axios";
import { useMessage } from "naive-ui";
import { useRegisterMutation } from "~/composables/useAuth";
import { useCaptcha } from "~/composables/useCaptcha";
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
const captcha = useCaptcha();

/**
 * Submits the registration form.
 *
 * Obtains a reCAPTCHA v3 token before sending the request. After a successful
 * registration the user is already signed in via the mutation's onSuccess hook
 * (see useRegisterMutation). We redirect directly to the email-confirmation
 * landing page so the user can either confirm or skip.
 *
 * @param values - Validated form data from SignupForm.
 */
const onSubmit = async (values: RegisterSchema): Promise<void> => {
  const { confirmPassword: _discard, ...registerPayload } = values;
  try {
    const captchaToken = await captcha.execute("register");
    await registerMutation.mutateAsync({ ...registerPayload, captchaToken });
    message.success(t("auth.register.successToast"), { duration: 3000 });
    // The mutation's onSuccess already calls sessionStore.signIn(), so the
    // user is authenticated. Redirect to the email-confirmation gate.
    await navigateTo("/confirm-email-pending");
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
