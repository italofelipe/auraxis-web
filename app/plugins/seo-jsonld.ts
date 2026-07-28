// ── SEO JSON-LD ───────────────────────────────────────────────────────────────
// Injects a WebApplication structured-data script on every prerendered page.
// Keeping this in a plugin (not app.vue) ensures it runs inside the Nuxt
// context, so useHead() has access to useNuxtApp() — required for SSG.
import { PRICING } from "~/shared/constants/pricing";

interface PlanOffer {
  "@type": "Offer";
  name: string;
  price: string;
  priceCurrency: typeof PRICING.CURRENCY;
  description?: string;
}

export interface WebApplicationJsonLd {
  "@context": "https://schema.org";
  "@type": "WebApplication";
  name: string;
  alternateName: string;
  description: string;
  url: string;
  applicationCategory: "FinanceApplication";
  operatingSystem: "Web";
  inLanguage: "pt-BR";
  offers: {
    "@type": "AggregateOffer";
    lowPrice: string;
    highPrice: string;
    priceCurrency: typeof PRICING.CURRENCY;
    offerCount: number;
    offers: PlanOffer[];
  };
  publisher: {
    "@type": "Organization";
    name: string;
    url: string;
  };
}

/**
 * Builds the sitewide WebApplication JSON-LD payload.
 *
 * The offer block mirrors the real plan matrix (ADR #669) as an
 * AggregateOffer — the previous single `Offer { price: "0" }` contradicted
 * the paid pricing shown on the landing and weakened rich results (#1210).
 *
 * @param rawSiteUrl Site origin, with or without a trailing slash.
 * @returns JSON-LD object ready to be serialized into a ld+json script tag.
 */
export const buildWebApplicationJsonLd = (rawSiteUrl: string): WebApplicationJsonLd => {
  const siteUrl = rawSiteUrl.replace(/\/$/, "");
  const plans: PlanOffer[] = [
    {
      "@type": "Offer",
      name: "Free",
      price: "0",
      priceCurrency: PRICING.CURRENCY,
      description: "Plano gratuito disponível",
    },
    {
      "@type": "Offer",
      name: "Premium mensal",
      price: PRICING.MONTHLY_PRICE.toFixed(2),
      priceCurrency: PRICING.CURRENCY,
    },
    {
      "@type": "Offer",
      name: "Premium anual",
      price: PRICING.ANNUAL_PRICE.toFixed(2),
      priceCurrency: PRICING.CURRENCY,
    },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Auraxis",
    alternateName: "Auraxis – Planner Financeiro Inteligente",
    description:
      "Planner financeiro inteligente para gerenciar carteira de investimentos, " +
      "metas financeiras e finanças pessoais.",
    url: siteUrl,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    inLanguage: "pt-BR",
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "0",
      highPrice: PRICING.ANNUAL_PRICE.toFixed(2),
      priceCurrency: PRICING.CURRENCY,
      offerCount: plans.length,
      offers: plans,
    },
    publisher: {
      "@type": "Organization",
      name: "Auraxis",
      url: siteUrl,
    },
  };
};

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  useHead({
    script: [
      {
        type: "application/ld+json",
        innerHTML: JSON.stringify(buildWebApplicationJsonLd(String(config.public.siteUrl))),
      },
    ],
  });
});
