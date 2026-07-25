/**
 * Static content model for the public capture landing (auraxis.com.br).
 *
 * The landing is a pt-BR-only surface (PO decision, issue #1165): copy lives
 * here as typed data instead of i18n keys so the frozen `en.json` catalog is
 * never touched and sections stay testable without rendering components.
 */

/** Absolute origin of the operational product app. */
export const APP_ORIGIN = "https://app.auraxis.com.br";

/**
 * Builds an absolute URL on the product app origin.
 *
 * The landing lives on the apex domain (auraxis.com.br) while every product
 * action (register, login, legal pages) happens on app.auraxis.com.br —
 * relative links would silently break, so all CTAs go through this helper.
 *
 * @param path App route path, with or without the leading slash.
 * @returns Absolute URL on the app origin.
 */
export const buildAppUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${APP_ORIGIN}${normalizedPath}`;
};

/** Primary CTA destination — direct registration on the product app. */
export const LANDING_REGISTER_URL = buildAppUrl("/register");

/** Discreet secondary action — login on the product app. */
export const LANDING_LOGIN_URL = buildAppUrl("/login");

/** Identifier keys for the four v1 product features, in display order. */
export type LandingFeatureKey = "transactions" | "goals" | "budgets" | "wallet";

export interface LandingFeature {
  readonly key: LandingFeatureKey;
  readonly title: string;
  readonly description: string;
}

/** Identifier keys for the three AI differentiators, in display order. */
export type LandingAiHighlightKey = "radar" | "chat" | "briefing";

export interface LandingAiHighlight {
  readonly key: LandingAiHighlightKey;
  readonly title: string;
  readonly description: string;
}

export interface LandingFooterLink {
  readonly label: string;
  readonly href: string;
}

/** Pain points that open the problem → solution narrative. */
export const LANDING_PAIN_POINTS: readonly string[] = [
  "Gastos espalhados entre cartões, contas e Pix — sem visão do todo.",
  "Metas que ficam só na cabeça porque nenhum número as acompanha.",
  "O orçamento estoura e você descobre quando já estourou.",
] as const;

/** The four product features of the landing v1, in the decided order. */
export const LANDING_FEATURES: readonly LandingFeature[] = [
  {
    key: "transactions",
    title: "Transações e cartões",
    description:
      "Cada compra, fatura e parcela no lugar certo. Registre em segundos, encontre em um clique e feche o mês sem sustos.",
  },
  {
    key: "goals",
    title: "Metas",
    description:
      "Da reserva de emergência à viagem: objetivos com progresso visível, aportes planejados e prazo realista.",
  },
  {
    key: "budgets",
    title: "Orçamentos",
    description:
      "Limites por categoria que avisam antes de estourar — não depois. O improviso sai da rotina.",
  },
  {
    key: "wallet",
    title: "Carteira",
    description:
      "Investimentos e patrimônio acompanhados junto do dia a dia, em vez de espalhados em outro aplicativo.",
  },
] as const;

/** The three AI differentiators highlighted on the landing. */
export const LANDING_AI_HIGHLIGHTS: readonly LandingAiHighlight[] = [
  {
    key: "radar",
    title: "Radar de gastos",
    description:
      "Detecta padrões de compra por impulso nos seus lançamentos e mostra o gatilho antes de a fatura chegar.",
  },
  {
    key: "chat",
    title: "Chat financeiro",
    description:
      "Pergunte “quanto gastei com mercado neste mês?” e receba a resposta na hora, calculada com os seus números.",
  },
  {
    key: "briefing",
    title: "Briefing semanal",
    description:
      "Um resumo editorial do que aconteceu com o seu dinheiro — direto, sem jargão e com o que merece atenção.",
  },
] as const;

/** Footer links — legal and support pages live on the product app. */
export const LANDING_FOOTER_LINKS: readonly LandingFooterLink[] = [
  { label: "Privacidade", href: buildAppUrl("/privacy") },
  { label: "Termos de uso", href: buildAppUrl("/terms") },
  { label: "Cookies", href: buildAppUrl("/cookies") },
  { label: "Suporte", href: buildAppUrl("/support") },
] as const;
