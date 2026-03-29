<script setup lang="ts">
import { NConfigProvider, NMessageProvider, NDialogProvider } from "naive-ui";
import { useNaiveTheme } from "~/composables/useNaiveTheme";

const { theme, themeOverrides } = useNaiveTheme();

// ── Structured data (JSON-LD) ────────────────────────────────────────────────
// WebApplication schema helps Google display rich results and understand the
// app category. Rendered on every prerendered page (/, /plans, /login, etc.).
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
</script>

<template>
  <!--
    NConfigProvider applies the Auraxis theme globally to all Naive UI components.
    - theme: darkTheme (Naive UI's built-in dark base, returned by useNaiveTheme)
    - themeOverrides: token overrides from app/composables/useNaiveTheme.ts
    - preflight-style-disabled: prevents Naive UI from injecting a CSS reset
      that would conflict with our own global styles in assets/css/main.css
  -->
  <NConfigProvider
    :theme="theme"
    :theme-overrides="themeOverrides"
    :preflight-style-disabled="true"
  >
    <NMessageProvider>
      <NDialogProvider>
        <NuxtLoadingIndicator color="var(--color-brand-500)" />
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>
