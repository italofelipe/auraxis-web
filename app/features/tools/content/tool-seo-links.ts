import type {
  ToolSeoContentCta,
  ToolSeoContentLink,
} from "~/features/tools/model/tool-seo-content";

export const TOOL_SEO_CTA: ToolSeoContentCta = {
  eyebrow: "Próximo passo",
  title: "Leve o cálculo para sua rotina financeira",
  body:
    "Crie uma conta grátis para transformar simulações em metas, acompanhar evolução e revisar decisões com mais contexto.",
  label: "Criar conta grátis",
  to: "/register",
};

export const ORCAMENTO_5030_RELATED_LINKS: readonly ToolSeoContentLink[] = [
  {
    label: "Juros compostos",
    description: "Veja quanto os 20% destinados a investimentos podem crescer no tempo.",
    to: "/tools/juros-compostos",
  },
  {
    label: "Reserva de emergência",
    description: "Calcule a meta de segurança antes de assumir gastos ou investimentos maiores.",
    to: "/tools/reserva-emergencia",
  },
  {
    label: "Controle de gastos",
    description: "Entenda como organizar despesas recorrentes e reduzir desperdícios.",
    to: "/controle-de-gastos",
  },
];

export const RESERVA_EMERGENCIA_RELATED_LINKS: readonly ToolSeoContentLink[] = [
  {
    label: "Orçamento 50/30/20",
    description: "Organize sua renda para abrir espaço mensal para a reserva.",
    to: "/tools/orcamento-50-30-20",
  },
  {
    label: "Juros compostos",
    description: "Simule o efeito dos aportes mensais enquanto sua reserva cresce.",
    to: "/tools/juros-compostos",
  },
  {
    label: "Planejador financeiro",
    description: "Conecte reserva, metas e rotina em um plano financeiro completo.",
    to: "/planejador-financeiro",
  },
];

export const JUROS_COMPOSTOS_RELATED_LINKS: readonly ToolSeoContentLink[] = [
  {
    label: "Orçamento 50/30/20",
    description: "Descubra quanto da renda pode virar aporte mensal sem apertar o caixa.",
    to: "/tools/orcamento-50-30-20",
  },
  {
    label: "Reserva de emergência",
    description: "Separe segurança de curto prazo antes de investir para objetivos longos.",
    to: "/tools/reserva-emergencia",
  },
  {
    label: "Análises financeiras",
    description: "Use o Auraxis para revisar padrões e oportunidades com mais contexto.",
    to: "/analises-financeiras",
  },
];
