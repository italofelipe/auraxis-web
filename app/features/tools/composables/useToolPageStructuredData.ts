import { useToolStructuredData } from "./useToolStructuredData";
import type { ToolFaqEntry } from "~/features/tools/model/structured-data.types";

// type (não interface): o Link tipado do unhead ≥3.3 exige a index signature
// implícita `data-${string}`, que interfaces não recebem.
type ToolAlternateLink = {
  rel: "alternate";
  /** unhead ≥3.3 exige `type` na variante rel="alternate" do Link tipado. */
  type: "text/html";
  hreflang: string;
  href: string;
};

/**
 * Monta os alternates hreflang de uma tool (PT-BR ↔ EN, x-default = PT-BR,
 * o idioma primário do produto). Puro para ser testável (#1222).
 *
 * @param baseUrl - Origin da surface ativa (ex.: `https://auraxis.com.br`).
 * @param slug - Slug da tool sob /tools/.
 * @returns Links prontos para o `useHead`.
 */
export const buildToolAlternateLinks = (
  baseUrl: string,
  slug: string,
): ToolAlternateLink[] => {
  const base = baseUrl.replace(/\/$/, "");
  const ptUrl = `${base}/tools/${slug}`;
  const enUrl = `${base}/en/tools/${slug}`;
  return [
    { rel: "alternate", type: "text/html", hreflang: "pt-BR", href: ptUrl },
    { rel: "alternate", type: "text/html", hreflang: "en", href: enUrl },
    { rel: "alternate", type: "text/html", hreflang: "x-default", href: ptUrl },
  ];
};

export interface UseToolPageStructuredDataInput {
  /** Tool slug, matching the URL segment under /tools/ (e.g. "juros-compostos"). */
  slug: string;
  /** Display name of the tool — used for WebApplication.name and breadcrumb leaf. */
  name: string;
  /** Short plain-text description for WebApplication.description. */
  description: string;
  /** Optional FAQs to expose as a FAQPage schema. */
  faqs?: readonly ToolFaqEntry[];
}

/**
 * Tool-page-level façade around `useToolStructuredData` that resolves the
 * canonical URL (locale-aware), builds the standard breadcrumb chain
 * (Home → Ferramentas → Tool), and injects all three JSON-LD payloads.
 *
 * Call it once in a tool page's `<script setup>` alongside `useSeoMeta`.
 *
 * @param input Tool slug, display name, description, and optional FAQs.
 */
export const useToolPageStructuredData = (
  input: UseToolPageStructuredDataInput,
): void => {
  const { locale, t } = useI18n();
  const siteConfig = useSiteConfig();

  const base = siteConfig.url ?? "https://app.auraxis.com.br";
  const localePrefix = locale.value === "en" ? "/en" : "";
  const toolsUrl = `${base}${localePrefix}/tools`;
  const toolUrl = `${toolsUrl}/${input.slug}`;

  // hreflang recíproco PT↔EN + x-default (#1222) — as tools existem nos dois
  // idiomas e sem os alternates o Google as trata como duplicatas sem relação.
  useHead({ link: buildToolAlternateLinks(base, input.slug) });

  useToolStructuredData({
    name: input.name,
    description: input.description,
    url: toolUrl,
    inLanguage: locale.value === "en" ? "en" : "pt-BR",
    faqs: input.faqs,
    breadcrumbs: [
      { name: t("pages.tools.meta.h1"), url: toolsUrl },
      { name: input.name, url: toolUrl },
    ],
  });
};
