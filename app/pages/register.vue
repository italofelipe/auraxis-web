<script setup lang="ts">
import { useLoginMutation, useRegisterMutation } from "~/composables/useAuth";
import { useAnalytics } from "~/composables/useAnalytics/useAnalytics";
import { useCaptcha } from "~/features/auth/composables/useCaptcha";
import { useRecordSignupConsentsMutation } from "~/features/privacy/queries/use-record-signup-consents-mutation";
import { useApiError } from "~/composables/useApiError";
import { useToast } from "~/composables/useToast";
import type { RegisterSchema } from "~/schemas/auth";

definePageMeta({ layout: "auth", middleware: ["guest-only"] });

const { t } = useI18n();
useSeoMeta({
  title: t("auth.register.title"),
  description: t("auth.register.metaDescription"),
  robots: "noindex, nofollow",
});
const toast = useToast();
const registerMutation = useRegisterMutation();
const loginMutation = useLoginMutation();
const recordConsentsMutation = useRecordSignupConsentsMutation();
const analytics = useAnalytics();
const captcha = useCaptcha();
const { getErrorMessage } = useApiError();
const isSubmitting = computed(
  () => registerMutation.isPending.value || loginMutation.isPending.value,
);

/**
 * Submits the registration form.
 *
 * Obtains a Cloudflare Turnstile token before registration. After the account
 * is created, signs in with the same submitted credentials and sends the user
 * to the authenticated dashboard.
 *
 * @param values - Validated form data from SignupForm.
 */
const onSubmit = async (values: RegisterSchema): Promise<void> => {
  const { confirmPassword: _discard, ...registerPayload } = values;
  try {
    const registerCaptchaToken = await captcha.execute();
    await registerMutation.mutateAsync({
      ...registerPayload,
      captchaToken: registerCaptchaToken,
    });

    const loginCaptchaToken = await captcha.execute();
    await loginMutation.mutateAsync({
      email: values.email,
      password: values.password,
      captchaToken: loginCaptchaToken,
    });

    // #1118 — grava o aceite versionado de Termos/Privacidade com timestamp.
    // Best-effort: falha não bloqueia o onboarding, mas fica rastreável.
    try {
      await recordConsentsMutation.mutateAsync();
    } catch {
      analytics.capture("signup_consent_record_failed", { source: "register" });
    }

    toast.success(t("auth.register.successToast"), { duration: 3000 });
    await navigateTo("/dashboard");
  } catch (err) {
    toast.error(getErrorMessage(err), { duration: 5000 });
  }
};
</script>

<template>
  <SignupForm :loading="isSubmitting" @submit="onSubmit" />
</template>
