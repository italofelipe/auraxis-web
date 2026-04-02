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
