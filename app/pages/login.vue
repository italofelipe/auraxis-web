<script setup lang="ts">
import { useMessage } from "naive-ui";
import { useLoginMutation } from "~/composables/useAuth";
import { useAuthRedirectContext } from "~/composables/useAuthRedirectContext";
import { useCaptcha } from "~/composables/useCaptcha";
import { useApiError } from "~/composables/useApiError";
import type { LoginSchema } from "~/schemas/auth";

definePageMeta({ layout: "auth", middleware: ["guest-only"] });

const { t } = useI18n();
useSeoMeta({
  title: t("auth.login.title"),
  description: t("auth.login.metaDescription"),
  robots: "noindex, nofollow",
});

const message = useMessage();
const loginMutation = useLoginMutation();
const { consumeRedirect } = useAuthRedirectContext();
const captcha = useCaptcha();
const { getErrorMessage } = useApiError();

/**
 * Submete as credenciais de login e redireciona ao destino pós-auth.
 *
 * Obtém um token Cloudflare Turnstile antes de enviar a requisição.
 * Quando o site key não está configurado (dev local) o token será null e o
 * backend deve aceitar o payload normalmente.
 *
 * @param values - Dados validados do formulário de login.
 */
const onSubmit = async (values: LoginSchema): Promise<void> => {
  try {
    const captchaToken = await captcha.execute();
    await loginMutation.mutateAsync({ ...values, captchaToken });
    // consumeRedirect returns the saved destination or "/dashboard" as fallback.
    // This preserves the "redirect to intended page after auth" pattern while
    // guaranteeing the user always lands on the Dashboard when there is no saved path.
    const redirect = consumeRedirect();
    await navigateTo(redirect || "/dashboard");
  } catch (err) {
    message.error(getErrorMessage(err), { duration: 5000 });
  }
};
</script>

<template>
  <LoginForm :loading="loginMutation.isPending.value" @submit="onSubmit" />
</template>
