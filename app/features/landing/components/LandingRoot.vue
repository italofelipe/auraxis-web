<script setup lang="ts">
import LandingAi from "./LandingAi.vue";
import LandingCta from "./LandingCta.vue";
import LandingFooter from "./LandingFooter.vue";
import LandingHeader from "./LandingHeader.vue";
import LandingHero from "./LandingHero.vue";
import LandingPricing from "./LandingPricing.vue";
import LandingShowcase from "./LandingShowcase.vue";

/**
 * Public capture landing for auraxis.com.br (issue #1165).
 *
 * Rendered by `pages/index.vue` only when the build surface is `landing`.
 * The landing owns its SEO identity: apex canonical, capture-focused copy and
 * a dedicated OG card. `titleTemplate: null` opts out of the global
 * "%s | Auraxis" suffix so the brand is not duplicated in the tab title.
 */

const LANDING_TITLE = "Auraxis — Planner financeiro inteligente com IA";
const LANDING_DESCRIPTION =
  "Organize transações, cartões, metas, orçamentos e carteira em um só lugar. " +
  "A IA do Auraxis mostra para onde seu dinheiro está indo antes que vire problema.";

useHead({
  titleTemplate: null,
  link: [
    { rel: "canonical", href: "https://auraxis.com.br/" },
    // A imagem do hero é o elemento LCP: pré-carregar tira ~1 round-trip da
    // descoberta (o browser só a acharia ao parsear o <img>). #1225
    {
      rel: "preload",
      as: "image",
      href: "/landing/dashboard-light.webp",
      type: "image/webp",
      fetchpriority: "high",
    },
  ],
});

useSeoMeta({
  title: LANDING_TITLE,
  description: LANDING_DESCRIPTION,
  robots: "index, follow",
  ogTitle: LANDING_TITLE,
  ogDescription: LANDING_DESCRIPTION,
  ogUrl: "https://auraxis.com.br/",
  ogImage: "https://auraxis.com.br/landing/og.png",
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterCard: "summary_large_image",
  twitterTitle: LANDING_TITLE,
  twitterDescription: LANDING_DESCRIPTION,
  twitterImage: "https://auraxis.com.br/landing/og.png",
});
</script>

<template>
  <div class="landing">
    <LandingHeader />
    <LandingHero />
    <LandingShowcase />
    <LandingAi />
    <LandingPricing />
    <LandingCta />
    <LandingFooter />
  </div>
</template>

<style scoped>
.landing {
  min-height: 100dvh;
  background: var(--landing-bg);
  color: var(--landing-body);
  font-family: var(--font-body);
  color-scheme: dark;
}

.landing ::selection {
  background: color-mix(in srgb, var(--landing-cyan) 36%, transparent);
  color: var(--landing-ink);
}
</style>
