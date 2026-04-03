/**
 * tools.ts — Static tool catalog
 *
 * Single source of truth for all public financial calculator routes.
 * This file drives:
 *   1. `nuxt.config.ts` → routeRules + nitro.prerender.routes (auto-generated)
 *   2. The /tools listing page
 *   3. Sitemap generation
 *
 * To add a new tool:
 *   1. Add a `ToolEntry` here.
 *   2. Create `app/pages/tools/<slug>.vue`.
 *   3. Done — routing, prerendering and the tools index update automatically.
 *
 * DO NOT add tool slugs manually to nuxt.config.ts.
 */

/** Access level a tool requires from the viewer. */
export type ToolAccessLevel = "public" | "authenticated" | "premium";

/** Category grouping for display and filtering. */
export type ToolCategory =
  | "payroll"        // Folha: INSS, IR, 13o, hora-extra, ferias, rescisao
  | "tax"            // Impostos: MEI, CLT vs PJ
  | "investments"    // Investimentos: juros compostos, CDB, Tesouro, FII
  | "planning"       // Planejamento: aposentadoria, FIRE, financiamento, aluguel
  | "utility";       // Utilitários: dividir conta, desconto, conversor, parcelado

/** A single tool entry in the static catalog. */
export interface ToolEntry {
  /** URL slug (without /tools/ prefix). Must match the .vue filename. */
  slug: string;
  /** i18n key for the tool name. */
  titleKey: string;
  /** i18n key for the short description. */
  descriptionKey: string;
  /** Category for grouping. */
  category: ToolCategory;
  /** Whether the tool requires authentication or premium subscription. */
  accessLevel: ToolAccessLevel;
  /**
   * Type of meta/goal this tool can create when connected to the platform.
   * Used by ToolResultCta to pre-fill goal creation.
   */
  relatedGoalType?: string;
}

/**
 * All public financial calculators available on the platform.
 * Ordered by category and then by perceived relevance/traffic.
 */
export const TOOLS: ToolEntry[] = [
  // ── Payroll / Folha de pagamento ──────────────────────────────────────
  {
    slug: "inss-ir-folha",
    titleKey: "tools.inssIrFolha.title",
    descriptionKey: "tools.inssIrFolha.description",
    category: "payroll",
    accessLevel: "public",
  },
  {
    slug: "thirteenth-salary",
    titleKey: "tools.thirteenthSalary.title",
    descriptionKey: "tools.thirteenthSalary.description",
    category: "payroll",
    accessLevel: "public",
  },
  {
    slug: "hora-extra",
    titleKey: "tools.horaExtra.title",
    descriptionKey: "tools.horaExtra.description",
    category: "payroll",
    accessLevel: "public",
  },
  {
    slug: "ferias",
    titleKey: "tools.ferias.title",
    descriptionKey: "tools.ferias.description",
    category: "payroll",
    accessLevel: "public",
  },
  {
    slug: "rescisao",
    titleKey: "tools.rescisao.title",
    descriptionKey: "tools.rescisao.description",
    category: "payroll",
    accessLevel: "public",
  },
  {
    slug: "fgts",
    titleKey: "tools.fgts.title",
    descriptionKey: "tools.fgts.description",
    category: "payroll",
    accessLevel: "public",
  },

  // ── Tax / Impostos ────────────────────────────────────────────────────
  {
    slug: "mei",
    titleKey: "tools.mei.title",
    descriptionKey: "tools.mei.description",
    category: "tax",
    accessLevel: "public",
  },
  {
    slug: "clt-vs-pj",
    titleKey: "tools.cltVsPj.title",
    descriptionKey: "tools.cltVsPj.description",
    category: "tax",
    accessLevel: "public",
  },

  // ── Investments / Investimentos ───────────────────────────────────────
  {
    slug: "juros-compostos",
    titleKey: "tools.jurosCompostos.title",
    descriptionKey: "tools.jurosCompostos.description",
    category: "investments",
    accessLevel: "public",
    relatedGoalType: "investment",
  },
  {
    slug: "cdb-lci-lca",
    titleKey: "tools.cdbLciLca.title",
    descriptionKey: "tools.cdbLciLca.description",
    category: "investments",
    accessLevel: "public",
    relatedGoalType: "investment",
  },
  {
    slug: "tesouro-direto",
    titleKey: "tools.tesouroDireto.title",
    descriptionKey: "tools.tesouroDireto.description",
    category: "investments",
    accessLevel: "public",
    relatedGoalType: "investment",
  },
  {
    slug: "fii",
    titleKey: "tools.fii.title",
    descriptionKey: "tools.fii.description",
    category: "investments",
    accessLevel: "public",
    relatedGoalType: "investment",
  },

  // ── Planning / Planejamento ───────────────────────────────────────────
  {
    slug: "aposentadoria",
    titleKey: "tools.aposentadoria.title",
    descriptionKey: "tools.aposentadoria.description",
    category: "planning",
    accessLevel: "public",
    relatedGoalType: "retirement",
  },
  {
    slug: "fire",
    titleKey: "tools.fire.title",
    descriptionKey: "tools.fire.description",
    category: "planning",
    accessLevel: "public",
    relatedGoalType: "fire",
  },
  {
    slug: "financiamento-imobiliario",
    titleKey: "tools.financiamentoImobiliario.title",
    descriptionKey: "tools.financiamentoImobiliario.description",
    category: "planning",
    accessLevel: "public",
    relatedGoalType: "real_estate",
  },
  {
    slug: "aluguel-vs-compra",
    titleKey: "tools.aluguelVsCompra.title",
    descriptionKey: "tools.aluguelVsCompra.description",
    category: "planning",
    accessLevel: "public",
    relatedGoalType: "real_estate",
  },

  // ── Utility / Utilitários ─────────────────────────────────────────────
  {
    slug: "dividir-conta",
    titleKey: "tools.dividirConta.title",
    descriptionKey: "tools.dividirConta.description",
    category: "utility",
    accessLevel: "public",
  },
  {
    slug: "desconto-markup",
    titleKey: "tools.descontoMarkup.title",
    descriptionKey: "tools.descontoMarkup.description",
    category: "utility",
    accessLevel: "public",
  },
  {
    slug: "conversor-moeda",
    titleKey: "tools.conversorMoeda.title",
    descriptionKey: "tools.conversorMoeda.description",
    category: "utility",
    accessLevel: "public",
  },
  {
    slug: "installment-vs-cash",
    titleKey: "tools.installmentVsCash.title",
    descriptionKey: "tools.installmentVsCash.description",
    category: "utility",
    accessLevel: "public",
  },
];

/** All tool slugs, derived from the catalog. Used by nuxt.config.ts. */
export const TOOL_SLUGS: string[] = TOOLS.map((t) => t.slug);
