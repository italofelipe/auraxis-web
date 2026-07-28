<script setup lang="ts">
import { useAnalytics } from "~/composables/useAnalytics/useAnalytics";
import { buildLandingCheckoutPath } from "~/features/landing/model/landing-checkout";
import { LANDING_LOGIN_URL } from "~/features/landing/model/landing-content";

/**
 * Landing return page when the buyer leaves the provider checkout (#1187).
 *
 * The account was already created before the redirect, so the way back in is
 * signing in — not registering again.
 */
definePageMeta({ layout: "public", publicChrome: false });

const analytics = useAnalytics();

onMounted((): void => {
  // Feeds the abandonment survey targeting (#1209) and the funnel drop-off
  // breakdown (#1208).
  analytics.capture("checkout_abandoned");
});

useSeoMeta({
  title: "Pagamento não concluído — Auraxis",
  description: "Você pode retomar a assinatura quando quiser.",
  robots: "noindex, nofollow",
});
</script>

<template>
  <main class="landing checkout-result" data-testid="landing-checkout-canceled">
    <div class="checkout-result__card">
      <h1 class="checkout-result__title">Pagamento não concluído.</h1>
      <p class="checkout-result__lead">
        Nada foi cobrado. Sua conta já está criada — você pode tentar de novo
        agora ou entrar e assinar mais tarde.
      </p>
      <a
        :href="buildLandingCheckoutPath('annual')"
        class="checkout-result__button"
        data-testid="landing-checkout-retry"
      >
        Tentar de novo
      </a>
      <p class="checkout-result__note">
        Já tem conta? <a :href="LANDING_LOGIN_URL">Entrar no Auraxis</a>
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
}

.checkout-result__note a {
  color: var(--landing-cyan);
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
