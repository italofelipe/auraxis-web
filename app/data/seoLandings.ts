import seoLandingSeedData from "./seoLandings.pt-BR.json";

export const SEO_LANDING_SLUGS = [
  "controle-financeiro",
  "financas",
  "insights-financeiros",
  "planejamento-financeiro",
  "analise-financeira",
  "planilha-de-gastos",
  "gestao-financeira",
  "inteligencia-financeira",
] as const;

export type SeoLandingSlug = (typeof SEO_LANDING_SLUGS)[number];

export interface SeoLandingCard {
  readonly title: string;
  readonly text: string;
}

export interface SeoLandingStep {
  readonly label: string;
  readonly title: string;
  readonly text: string;
}

export interface SeoLandingFaq {
  readonly question: string;
  readonly answer: string;
}

export interface SeoLandingLink {
  readonly label: string;
  readonly to: string;
}

export interface SeoLanding {
  readonly slug: SeoLandingSlug;
  readonly keyword: string;
  readonly title: string;
  readonly description: string;
  readonly h1: string;
  readonly kicker: string;
  readonly lead: string;
  readonly visualCaption: string;
  readonly proofPoints: readonly string[];
  readonly highlights: readonly SeoLandingCard[];
  readonly workflow: readonly SeoLandingStep[];
  readonly faq: readonly SeoLandingFaq[];
  readonly relatedLinks: readonly SeoLandingLink[];
}

const relatedLinks: readonly SeoLandingLink[] = [
  { label: "Controle financeiro", to: "/controle-financeiro" },
  { label: "Finanças", to: "/financas" },
  { label: "Insights financeiros", to: "/insights-financeiros" },
  { label: "Planejamento financeiro", to: "/planejamento-financeiro" },
  { label: "Análise financeira", to: "/analise-financeira" },
  { label: "Planilha de gastos", to: "/planilha-de-gastos" },
  { label: "Gestão financeira", to: "/gestao-financeira" },
  { label: "Inteligência financeira", to: "/inteligencia-financeira" },
];

const sharedFaq: readonly SeoLandingFaq[] = [
  {
    question: "O Auraxis substitui orientação financeira profissional?",
    answer:
      "Não. O Auraxis organiza seus dados e apresenta análises para apoiar sua rotina, mas não promete recomendação financeira personalizada.",
  },
  {
    question: "Preciso cadastrar tudo antes de enxergar valor?",
    answer:
      "Não. Você pode começar com poucos lançamentos, uma meta ou uma ferramenta pública e evoluir o painel aos poucos.",
  },
  {
    question: "Os recursos de IA usam meus dados para treinar modelos?",
    answer:
      "Não. Os dados do usuário não devem ser usados para treinar modelos, e recursos de IA dependem de consentimento ativo.",
  },
];

type SeoLandingWorkflowSeed = Readonly<Pick<SeoLandingStep, "title" | "text">>;

/**
 * Data-only seed imported from the PT-BR SEO copy file.
 */
type SeoLandingSeed = Omit<SeoLanding, "faq" | "relatedLinks" | "workflow"> & {
  readonly workflow: readonly SeoLandingWorkflowSeed[];
};

const landingSeeds = seoLandingSeedData as readonly SeoLandingSeed[];

/**
 * Converts compact JSON workflow entries into numbered landing steps.
 *
 * @param items - Workflow step title/body entries.
 * @returns Numbered workflow steps consumed by the landing page.
 */
function makeWorkflow(items: readonly SeoLandingWorkflowSeed[]): readonly SeoLandingStep[] {
  return items.map(({ title, text }, index) => ({
    label: String(index + 1),
    title,
    text,
  }));
}

export const SEO_LANDINGS: readonly SeoLanding[] = landingSeeds.map((landing) => ({
  ...landing,
  workflow: makeWorkflow(landing.workflow),
  faq: sharedFaq,
  relatedLinks,
}));

const landingsBySlug = new Map<SeoLandingSlug, SeoLanding>(
  SEO_LANDINGS.map((landing) => [landing.slug, landing]),
);

/**
 * Resolves commercial SEO landing metadata by slug.
 *
 * @param slug - Single path segment from the public landing route.
 * @returns Landing metadata when the slug is part of the canonical keyword map.
 */
export function getSeoLanding(slug: string): SeoLanding | undefined {
  return SEO_LANDING_SLUGS.includes(slug as SeoLandingSlug)
    ? landingsBySlug.get(slug as SeoLandingSlug)
    : undefined;
}
