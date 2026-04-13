import { defineNuxtRouteMiddleware, useSeoMeta } from "#app";

/**
 * Injects SEO meta tags for static legal pages.
 *
 * These pages use `definePageMeta({ layout: false })` without i18n, so SEO
 * is applied here rather than inside the component to keep the component
 * clean and unit-testable without a Nuxt runtime context.
 */

const LEGAL_SEO: Record<string, { title: string; description: string }> = {
  "/privacy-policy": {
    title: "Política de Privacidade",
    description: "Saiba como o Auraxis coleta, usa e protege seus dados pessoais em conformidade com a LGPD.",
  },
  "/en/privacy-policy": {
    title: "Privacy Policy",
    description: "Learn how Auraxis collects, uses and protects your personal data in compliance with LGPD.",
  },
  "/terms-of-service": {
    title: "Termos de Uso",
    description: "Leia os Termos de Uso do Auraxis — planner financeiro inteligente para gerenciar carteira e metas.",
  },
  "/en/terms-of-service": {
    title: "Terms of Service",
    description: "Read the Auraxis Terms of Service — smart financial planner for managing your portfolio and goals.",
  },
};

export default defineNuxtRouteMiddleware((to) => {
  const seo = LEGAL_SEO[to.path];
  if (!seo) {
    return;
  }

  useSeoMeta({
    title: seo.title,
    description: seo.description,
    ogTitle: `${seo.title} | Auraxis`,
    ogDescription: seo.description,
  });
});
