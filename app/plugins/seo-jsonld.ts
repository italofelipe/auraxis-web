// ── SEO JSON-LD ───────────────────────────────────────────────────────────────
// Injects a WebApplication structured-data script on every prerendered page.
// Keeping this in a plugin (not app.vue) ensures it runs inside the Nuxt
// context, so useHead() has access to useNuxtApp() — required for SSG.
export default defineNuxtPlugin(() => {
  useHead({
    script: [
      {
        type: "application/ld+json",
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Auraxis",
          "alternateName": "Auraxis – Planner Financeiro Inteligente",
          "description":
            "Planner financeiro inteligente para gerenciar carteira de investimentos, "
            + "metas financeiras e finanças pessoais.",
          "url": "https://app.auraxis.com.br",
          "applicationCategory": "FinanceApplication",
          "operatingSystem": "Web",
          "inLanguage": "pt-BR",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "BRL",
            "description": "Plano gratuito disponível",
          },
          "publisher": {
            "@type": "Organization",
            "name": "Auraxis",
            "url": "https://app.auraxis.com.br",
          },
        }),
      },
    ],
  });
});
