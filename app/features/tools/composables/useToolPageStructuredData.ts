import { useToolStructuredData } from "./useToolStructuredData";
import type { ToolFaqEntry } from "~/features/tools/model/structured-data.types";

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
