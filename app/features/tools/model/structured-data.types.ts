/**
 * JSON-LD (schema.org) type definitions for the tools catalog.
 *
 * These types mirror the public schema.org contract so rich results
 * validate against Google's Rich Results Test without runtime surprises.
 *
 * References:
 * - https://schema.org/WebApplication
 * - https://schema.org/FAQPage
 * - https://schema.org/BreadcrumbList
 */

/** A single FAQ entry (question + answer), rendered as Q&A in rich results. */
export interface ToolFaqEntry {
  /** The question text, ideally phrased as a natural-language query. */
  question: string;
  /** The answer text in plain language (may contain inline HTML when needed). */
  answer: string;
}

/** A single breadcrumb step (home → section → leaf). */
export interface ToolBreadcrumb {
  /** Human-readable label displayed in the breadcrumb chain. */
  name: string;
  /** Absolute URL the breadcrumb points to. */
  url: string;
}

/** schema.org/WebApplication JSON-LD output. */
export interface WebApplicationSchema {
  "@context": "https://schema.org";
  "@type": "WebApplication";
  name: string;
  description: string;
  url: string;
  applicationCategory: "FinanceApplication";
  operatingSystem: "Web";
  inLanguage: string;
  offers: {
    "@type": "Offer";
    price: "0";
    priceCurrency: "BRL";
  };
}

/** schema.org/FAQPage JSON-LD output. */
export interface FaqPageSchema {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: ReadonlyArray<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }>;
}

/** schema.org/BreadcrumbList JSON-LD output. */
export interface BreadcrumbListSchema {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: ReadonlyArray<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
}

/** Input accepted by the structured-data composable. */
export interface ToolStructuredDataInput {
  /** Display name of the tool (used as WebApplication.name). */
  name: string;
  /** Short description of what the tool does. */
  description: string;
  /** Absolute canonical URL of the tool page. */
  url: string;
  /** Language tag (e.g. `pt-BR`, `en`). Defaults to `pt-BR` when absent. */
  inLanguage?: string;
  /** Optional list of FAQ entries — omit (or empty) to skip FAQPage schema. */
  faqs?: readonly ToolFaqEntry[];
  /** Optional breadcrumb chain — omit (or empty) to skip BreadcrumbList schema. */
  breadcrumbs?: readonly ToolBreadcrumb[];
}

/** Result returned by `useToolStructuredData`: the three possible JSON-LD payloads. */
export interface ToolStructuredDataPayload {
  webApplication: WebApplicationSchema;
  faqPage: FaqPageSchema | null;
  breadcrumbList: BreadcrumbListSchema | null;
}
