import type { ToolFaqEntry } from "~/features/tools/model/structured-data.types";

export interface ToolSeoContentLink {
  label: string;
  description: string;
  to: string;
}

export interface ToolSeoContentCta {
  eyebrow: string;
  title: string;
  body: string;
  label: string;
  to: string;
}

export interface ToolSeoContentProps {
  title: string;
  description: string;
  faqs: readonly ToolFaqEntry[];
  relatedLinks: readonly ToolSeoContentLink[];
  cta: ToolSeoContentCta;
}
