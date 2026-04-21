import type {
  BreadcrumbListSchema,
  FaqPageSchema,
  ToolStructuredDataInput,
  ToolStructuredDataPayload,
  WebApplicationSchema,
} from "~/features/tools/model/structured-data.types";

/**
 * Pure builder for the three schema.org JSON-LD payloads supported by tools.
 *
 * Kept as a pure function (no `useHead`) so it can be tested in isolation and
 * reused by tests, Storybook, or server-side renderers. Vue integration lives
 * in `<ToolStructuredData />`, which wraps this builder and injects via useHead.
 *
 * @param input Tool metadata, optional FAQs, and optional breadcrumb chain.
 * @returns A payload containing the three JSON-LD objects (FAQ/breadcrumb
 *          nulled out when not provided).
 */
export const buildToolStructuredData = (
  input: ToolStructuredDataInput,
): ToolStructuredDataPayload => {
  const webApplication: WebApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: input.name,
    description: input.description,
    url: input.url,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    inLanguage: input.inLanguage ?? "pt-BR",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "BRL",
    },
  };

  const faqPage: FaqPageSchema | null =
    input.faqs && input.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: input.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }
      : null;

  const breadcrumbList: BreadcrumbListSchema | null =
    input.breadcrumbs && input.breadcrumbs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: input.breadcrumbs.map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: crumb.name,
            item: crumb.url,
          })),
        }
      : null;

  return { webApplication, faqPage, breadcrumbList };
};

/**
 * Stable head-script descriptor used by `useToolStructuredData`.
 * Exposed separately so tests can assert the exact output shape without
 * needing to mock `useHead`.
 */
export interface ToolStructuredDataScript {
  id: string;
  type: "application/ld+json";
  children: string;
}

/**
 * Builds the list of `<script type="application/ld+json">` descriptors that
 * should be passed to `useHead({ script })`. Each entry carries a stable id
 * (`ld-tool-webapp`, `ld-tool-faq`, `ld-tool-breadcrumb`) so Nuxt dedupes
 * the payload across navigations.
 *
 * @param payload Payload produced by `buildToolStructuredData`.
 * @returns Ordered list of head script descriptors.
 */
export const buildToolStructuredDataScripts = (
  payload: ToolStructuredDataPayload,
): ToolStructuredDataScript[] => {
  const scripts: ToolStructuredDataScript[] = [
    {
      id: "ld-tool-webapp",
      type: "application/ld+json",
      children: JSON.stringify(payload.webApplication),
    },
  ];

  if (payload.faqPage) {
    scripts.push({
      id: "ld-tool-faq",
      type: "application/ld+json",
      children: JSON.stringify(payload.faqPage),
    });
  }

  if (payload.breadcrumbList) {
    scripts.push({
      id: "ld-tool-breadcrumb",
      type: "application/ld+json",
      children: JSON.stringify(payload.breadcrumbList),
    });
  }

  return scripts;
};

/**
 * Composable that builds the JSON-LD payloads and injects them into the
 * document head as `<script type="application/ld+json">` tags.
 *
 * @param input Tool metadata, optional FAQs, and optional breadcrumb chain.
 * @returns The underlying payload (useful for tests / previews).
 */
export const useToolStructuredData = (
  input: ToolStructuredDataInput,
): ToolStructuredDataPayload => {
  const payload = buildToolStructuredData(input);
  useHead({
    script: buildToolStructuredDataScripts(payload).map((s) => ({ ...s })),
  });
  return payload;
};
