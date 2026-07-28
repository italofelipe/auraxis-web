import { TOOLS_CATALOG } from "./tools-catalog";
import type { ToolCategory } from "./tools";

/**
 * Um destino sugerido a partir de uma tool. `kind` existe para o template
 * agrupar/rotular sem reinspecionar a URL.
 */
export interface ToolRelatedLink {
  /** Texto visível do link. */
  label: string;
  /** Caminho relativo — conteúdo é servido pela mesma surface (apex). */
  to: string;
  /** Natureza do destino: outra calculadora ou uma página temática. */
  kind: "tool" | "guide";
}

/**
 * Guia temático por categoria: leva quem chegou por uma calculadora para o
 * conteúdo de fundo do mesmo assunto, distribuindo autoridade dentro do apex
 * em vez de terminar a sessão na ferramenta (#1224).
 */
const CATEGORY_GUIDES: Record<ToolCategory, readonly ToolRelatedLink[]> = {
  "clt-trabalho": [
    { label: "Planejamento financeiro", to: "/planejamento-financeiro", kind: "guide" },
    { label: "Controle financeiro", to: "/controle-financeiro", kind: "guide" },
  ],
  "dividas-credito": [
    { label: "Controle financeiro", to: "/controle-financeiro", kind: "guide" },
    { label: "Planilha de gastos", to: "/planilha-de-gastos", kind: "guide" },
  ],
  investimentos: [
    { label: "Análise financeira", to: "/analise-financeira", kind: "guide" },
    { label: "Inteligência financeira", to: "/inteligencia-financeira", kind: "guide" },
  ],
  planejamento: [
    { label: "Planejamento financeiro", to: "/planejamento-financeiro", kind: "guide" },
    { label: "Insights financeiros", to: "/insights-financeiros", kind: "guide" },
  ],
  imoveis: [
    { label: "Planejamento financeiro", to: "/planejamento-financeiro", kind: "guide" },
    { label: "Análise financeira", to: "/analise-financeira", kind: "guide" },
  ],
  utilidades: [
    { label: "Planilha de gastos", to: "/planilha-de-gastos", kind: "guide" },
    { label: "Gestão financeira", to: "/gestao-financeira", kind: "guide" },
  ],
};

/** Teto do bloco: mais que isso vira lista de links, não sugestão. */
const MAX_LINKS = 5;
const MAX_SIBLINGS = 3;

/**
 * Monta os links relacionados de uma calculadora: irmãs da mesma categoria
 * (derivadas do catálogo, sem mapa manual para desatualizar) mais os guias
 * temáticos da categoria.
 *
 * @param toolId - Id da tool no catálogo (igual ao slug da rota).
 * @returns Links prontos para renderizar; vazio se o id não existir.
 */
export const buildToolRelatedLinks = (toolId: string): readonly ToolRelatedLink[] => {
  const current = TOOLS_CATALOG.find((tool) => tool.id === toolId);
  // `category` é opcional no catálogo; sem ela não há tema para sugerir.
  const category = current?.category;
  if (!current || !category) {
    return [];
  }

  const siblings: ToolRelatedLink[] = TOOLS_CATALOG.filter(
    (tool) => tool.category === category && tool.id !== current.id && tool.enabled,
  )
    .slice(0, MAX_SIBLINGS)
    .map((tool) => ({ label: tool.name, to: tool.route, kind: "tool" as const }));

  const guides = CATEGORY_GUIDES[category] ?? [];

  return [...siblings, ...guides].slice(0, MAX_LINKS);
};
