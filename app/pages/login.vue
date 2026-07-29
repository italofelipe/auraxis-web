<script setup lang="ts">
import { useLoginMutation } from "~/composables/useAuth";
import { useAuthRedirectContext } from "~/composables/useAuthRedirectContext";
import {
  readLoginEntryContextFromSources,
  resolvePostLoginDestination,
  type LoginEntryContext,
} from "~/features/auth/model/login-entry-context";
import { useCaptcha } from "~/features/auth/composables/useCaptcha";
import { useApiError } from "~/composables/useApiError";
import { useToast } from "~/composables/useToast";
import type { LoginSchema } from "~/schemas/auth";

definePageMeta({ layout: "auth", middleware: ["guest-only"] });

const { t } = useI18n();
useSeoMeta({
  title: t("auth.login.title"),
  description: t("auth.login.metaDescription"),
  robots: "noindex, nofollow",
});

const toast = useToast();
const loginMutation = useLoginMutation();
const { consumeRedirect } = useAuthRedirectContext();

// Quem tentou assinar com uma conta que já existe chega aqui vindo do apex
// (#1243). O contexto viaja por query porque as origens são diferentes.
const route = useRoute();
const entryContext = ref<LoginEntryContext>({ reason: null, planSlug: null });
const welcomeBackNotice = computed((): string =>
  entryContext.value.reason === "conta-existente"
    ? t("auth.login.existingAccountNotice")
    : "",
);

onMounted((): void => {
  // Esta página é prerenderizada: ao hidratar, o Nuxt normaliza a rota e
  // `route.query` chega vazio — às vezes `location.search` também. A entrada de
  // navegação preserva a URL original (mesmo motivo do checkout, #1203).
  const navigationEntry = performance.getEntriesByType("navigation")[0];
  entryContext.value = readLoginEntryContextFromSources(
    route.query,
    window.location.search,
    navigationEntry && "name" in navigationEntry ? navigationEntry.name : null,
  );
});
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
    // Quem veio do checkout estava comprando: retomar a assinatura tem
    // precedência sobre o destino salvo, senão a venda se perde no dashboard.
    const resumePurchase = resolvePostLoginDestination(entryContext.value);
    const redirect = consumeRedirect();
    await navigateTo(resumePurchase ?? redirect ?? "/dashboard");
  } catch (err) {
    toast.error(getErrorMessage(err), { duration: 5000 });
  }
};
</script>

<template>
  <LoginForm
    :loading="loginMutation.isPending.value"
    :notice="welcomeBackNotice"
    @submit="onSubmit"
  />
</template>
