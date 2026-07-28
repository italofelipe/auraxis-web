<script setup lang="ts">
import { CheckCircle2 } from "lucide-vue-next";

import { useAnalytics } from "~/composables/useAnalytics/useAnalytics";
import { LANDING_LOGIN_URL } from "~/features/landing/model/landing-content";

/**
 * Landing return page after a confirmed payment (#1187).
 *
 * The buyer created the account on the landing domain, so there is no session
 * on the app origin yet — this page acknowledges the purchase and sends them
 * to the app to sign in. The webhook remains the source of truth for the
 * entitlement; nothing here grants access.
 */
definePageMeta({ layout: "public" });

const analytics = useAnalytics();

onMounted((): void => {
  // Mirrors app/pages/checkout/success.vue: the paid conversion that happens
  // on the apex finally emits the #524 contract event (#1208).
  analytics.capture("upgrade_completed", { source: "landing-checkout-success" });
});

useSeoMeta({
  title: "Pagamento confirmado — Auraxis",
  description: "Sua assinatura do Auraxis Premium foi iniciada.",
  robots: "noindex, nofollow",
});
</script>

<template>
  <main class="landing checkout-result" data-testid="landing-checkout-success">
    <div class="checkout-result__card">
      <CheckCircle2 class="checkout-result__icon" :size="56" aria-hidden="true" />
      <h1 class="checkout-result__title">Tudo certo com o seu pagamento.</h1>
      <p class="checkout-result__lead">
        Sua conta já está criada. Entre no Auraxis para começar a registrar seus
        lançamentos — o acesso Premium é liberado assim que a confirmação do
        pagamento chega, o que costuma levar poucos instantes.
      </p>
      <a
        :href="LANDING_LOGIN_URL"
        class="checkout-result__button"
        data-testid="landing-checkout-success-cta"
      >
        Entrar no Auraxis
      </a>
      <p class="checkout-result__note">
        Enviamos um email de confirmação para você. Se algo parecer errado,
        fale com a gente em suporte@auraxis.com.br.
      </p>
    </div>
  </main>
</template>

<style scoped>
.checkout-result {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: var(--space-5);
  background: var(--landing-bg);
  color: var(--landing-ink);
}

.checkout-result__card {
  display: grid;
  justify-items: center;
  gap: var(--space-3);
  width: min(560px, 100%);
  padding: var(--space-7) var(--space-5);
  border: 1px solid var(--landing-line);
  border-radius: var(--landing-radius-card);
  background: var(--landing-surface);
  text-align: center;
}

.checkout-result__icon {
  color: var(--landing-cyan);
}

.checkout-result__title {
  margin: 0;
  color: var(--landing-ink);
  font-family: var(--landing-font-display);
  font-size: var(--landing-size-h3);
  font-weight: var(--font-weight-medium);
}

.checkout-result__lead {
  margin: 0;
  color: var(--landing-body);
  font-size: var(--landing-size-sm);
  line-height: var(--landing-leading-body);
}

.checkout-result__button {
  display: inline-flex;
  align-items: center;
  min-height: 50px;
  padding-inline: var(--space-6);
  border-radius: var(--landing-radius-pill);
  background: var(--landing-grad);
  color: var(--landing-cyan-ink);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  text-decoration: none;
}

.checkout-result__note {
  margin: 0;
  color: var(--landing-muted);
  font-size: var(--landing-size-fine);
  line-height: var(--landing-leading-body);
}
</style>
