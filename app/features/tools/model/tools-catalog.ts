import type { Tool } from "./tools";

/**
 * Frontend-defined static catalog of all tools in the platform.
 * There is no backend catalog endpoint — this list is the source of truth
 * for which tools exist and how they are presented.
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
  },
  {
    id: "thirteenth-salary",
    name: "Simulador de 13º Salário",
    description:
      "Calcule o valor líquido do seu 13º salário com INSS e IR proporcionais aos meses trabalhados.",
    enabled: true,
    accessLevel: "public",
    route: "/tools/thirteenth-salary",
  },
];

/**
 * Returns only the tools that are currently enabled.
 *
 * @returns Filtered readonly array of enabled tools.
 */
export const getEnabledTools = (): readonly Tool[] =>
  TOOLS_CATALOG.filter((t) => t.enabled);
