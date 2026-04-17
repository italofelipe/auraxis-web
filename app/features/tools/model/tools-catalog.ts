import { isFeatureEnabled } from "~/shared/feature-flags";

import type { Tool } from "./tools";

/**
 * Frontend-defined static catalog of all tools in the platform.
 *
 * There is no backend catalog endpoint — this list is the source of truth
 * for which tools exist, their access level, and which feature flag gates them.
 *
 * Adding a new tool requires:
 *  1. An entry here with a matching `featureFlag` key.
 *  2. A corresponding entry in `config/feature-flags.json`.
 *  3. Setting the flag status to `enabled-prod` once the tool page is deployed.
 */
export const TOOLS_CATALOG: readonly Tool[] = [
  {
    id: "installment-vs-cash",
    name: "Parcelado vs À Vista",
    description:
      "Compare se vale mais a pena pagar à vista ou parcelado, considerando taxa de oportunidade e inflação.",
    enabled: true,
    accessLevel: "public",
    route: "/tools/installment-vs-cash",
    featureFlag: "web.tools.installment-vs-cash",
    saveIntent: "goal",
  },
  {
    id: "thirteenth-salary",
    name: "Simulador de 13º Salário",
    description:
      "Calcule o valor líquido do 13º salário com INSS e IR proporcionais ao período trabalhado.",
    enabled: true,
    accessLevel: "public",
    route: "/tools/thirteenth-salary",
    featureFlag: "web.tools.thirteenth-salary",
    saveIntent: "receivable",
  },
  {
    id: "inss-ir-folha",
    name: "INSS + IR na Folha",
    description:
      "Veja exatamente quanto INSS e IR descontam do salário, faixa a faixa, com todas as deduções do IR.",
    enabled: true,
    accessLevel: "public",
    route: "/tools/inss-ir-folha",
    featureFlag: "web.tools.inss-ir-folha",
    saveIntent: "expense",
  },
  {
    id: "hora-extra",
    name: "Hora Extra CLT",
    description:
      "Calcule o valor bruto e líquido das suas horas extras CLT (50%, 75%, 100%) e o impacto no INSS.",
    enabled: true,
    accessLevel: "public",
    route: "/tools/hora-extra",
    featureFlag: "web.tools.hora-extra",
    saveIntent: "receivable",
  },
  {
    id: "ferias",
    name: "Simulador de Férias CLT",
    description:
      "Calcule o valor bruto e líquido das suas férias, com 1/3 constitucional, abono pecuniário e impacto no INSS e IR.",
    enabled: true,
    accessLevel: "public",
    route: "/tools/ferias",
    featureFlag: "web.tools.ferias",
    saveIntent: "receivable",
  },
  {
    id: "rescisao",
    name: "Rescisão Contratual CLT",
    description:
      "Calcule o valor bruto e líquido da rescisão: aviso prévio, 13º, férias, FGTS e descontos de INSS/IR.",
    enabled: true,
    accessLevel: "public",
    route: "/tools/rescisao",
    featureFlag: "web.tools.rescisao",
    saveIntent: "receivable",
  },
  {
    id: "dividir-conta",
    name: "Dividir Conta",
    description:
      "Calcule quanto cada pessoa deve pagar na conta do restaurante, com taxa da casa, gorjeta e consumo individual.",
    enabled: true,
    accessLevel: "public",
    route: "/tools/dividir-conta",
    featureFlag: "web.tools.dividir-conta",
    saveIntent: "none",
  },
  {
    id: "desconto-markup",
    name: "Desconto, Markup e Margem",
    description:
      "Calcule descontos, markup de preço e margem de lucro em 4 modos: desconto, markup, margem e reverso.",
    enabled: true,
    accessLevel: "public",
    route: "/tools/desconto-markup",
    featureFlag: "web.tools.desconto-markup",
    saveIntent: "none",
  },
  {
    id: "juros-compostos",
    name: "Juros Compostos e Taxa Real",
    description:
      "Simule o crescimento do seu capital com aportes mensais e veja a taxa real descontada a inflação (fórmula de Fisher).",
    enabled: true,
    accessLevel: "public",
    route: "/tools/juros-compostos",
    featureFlag: "web.tools.juros-compostos",
    saveIntent: "goal",
  },
  {
    id: "fgts",
    name: "Simulador de FGTS",
    description:
      "Calcule seu saldo projetado de FGTS, a multa rescisória por tipo de desligamento e o valor total disponível para saque.",
    enabled: true,
    accessLevel: "public",
    route: "/tools/fgts",
    featureFlag: "web.tools.fgts",
    saveIntent: "receivable",
  },
  {
    id: "clt-vs-pj",
    name: "CLT vs PJ",
    description:
      "Compare o rendimento líquido real entre CLT e PJ considerando INSS, IR, benefícios e regime tributário.",
    enabled: true,
    accessLevel: "public",
    route: "/tools/clt-vs-pj",
    featureFlag: "web.tools.clt-vs-pj",
    saveIntent: "receivable",
  },
  {
    id: "mei",
    name: "Calculadora MEI",
    description:
      "Calcule o DAS mensal por atividade, veja os benefícios previdenciários e compare com o regime PF autônomo.",
    enabled: true,
    accessLevel: "public",
    route: "/tools/mei",
    featureFlag: "web.tools.mei",
    saveIntent: "expense",
  },
  {
    id: "cdb-lci-lca",
    name: "CDB / LCI / LCA vs Poupança",
    description:
      "Compare a rentabilidade líquida real de CDB, LCI/LCA e Poupança, com IR regressivo e ranking automático.",
    enabled: isFeatureEnabled("web.tools.cdb-lci-lca"),
    accessLevel: "public",
    route: "/tools/cdb-lci-lca",
    featureFlag: "web.tools.cdb-lci-lca",
    saveIntent: "goal",
  },
  {
    id: "tesouro-direto",
    name: "Tesouro Direto",
    description:
      "Simule títulos do Tesouro Direto até o vencimento (Selic, IPCA+, Prefixado) com taxa de custódia B3 e IR.",
    enabled: isFeatureEnabled("web.tools.tesouro-direto"),
    accessLevel: "public",
    route: "/tools/tesouro-direto",
    featureFlag: "web.tools.tesouro-direto",
    saveIntent: "goal",
  },
  {
    id: "aposentadoria",
    name: "Simulador de Aposentadoria",
    description:
      "Descubra quanto guardar por mês para se aposentar com a renda desejada usando a Regra dos 25x.",
    enabled: isFeatureEnabled("web.tools.aposentadoria"),
    accessLevel: "public",
    route: "/tools/aposentadoria",
    featureFlag: "web.tools.aposentadoria",
    saveIntent: "goal",
  },
  {
    id: "fire",
    name: "Calculadora FIRE",
    description:
      "Planeje sua independência financeira com as variantes FIRE, Lean FIRE, Fat FIRE e Coast FIRE.",
    enabled: isFeatureEnabled("web.tools.fire"),
    accessLevel: "public",
    route: "/tools/fire",
    featureFlag: "web.tools.fire",
    saveIntent: "goal",
  },
  {
    id: "financiamento-imobiliario",
    name: "Financiamento Imobiliário",
    description:
      "Compare SAC e PRICE lado a lado: primeira e última parcela, total de juros e CET estimado.",
    enabled: isFeatureEnabled("web.tools.financiamento-imobiliario"),
    accessLevel: "public",
    route: "/tools/financiamento-imobiliario",
    featureFlag: "web.tools.financiamento-imobiliario",
    saveIntent: "goal",
  },
  {
    id: "aluguel-vs-compra",
    name: "Aluguel vs Compra",
    description:
      "Compare o custo total de alugar ou comprar um imóvel com custo de oportunidade e projeção patrimonial.",
    enabled: isFeatureEnabled("web.tools.aluguel-vs-compra"),
    accessLevel: "public",
    route: "/tools/aluguel-vs-compra",
    featureFlag: "web.tools.aluguel-vs-compra",
    saveIntent: "goal",
  },
  {
    id: "conversor-moeda",
    name: "Conversor de Moeda",
    description:
      "Converta entre Real e moedas estrangeiras com cotação em tempo real via BRAPI.",
    enabled: isFeatureEnabled("web.tools.conversor-moeda"),
    accessLevel: "public",
    route: "/tools/conversor-moeda",
    featureFlag: "web.tools.conversor-moeda",
    saveIntent: "none",
  },
  {
    id: "fii",
    name: "Calculadora de FII",
    description:
      "Calcule Dividend Yield, Yield on Cost e renda passiva de Fundos Imobiliários.",
    enabled: isFeatureEnabled("web.tools.fii"),
    accessLevel: "public",
    route: "/tools/fii",
    featureFlag: "web.tools.fii",
    saveIntent: "goal",
  },
];

/**
 * Returns tools that are active for the current environment.
 *
 * A tool is included when BOTH conditions are true:
 *  - `enabled` is true in the catalog (static deployment gate)
 *  - its `featureFlag` is enabled for the current runtime environment,
 *    OR it has no `featureFlag` (always visible)
 *
 * @returns Filtered readonly array of active tools.
 */
export const getEnabledTools = (): readonly Tool[] =>
  TOOLS_CATALOG.filter((t) => {
    if (!t.enabled) {return false;}
    if (!t.featureFlag) {return true;}
    return isFeatureEnabled(t.featureFlag);
  });
