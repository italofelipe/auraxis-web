import type { ToolFaqEntry } from "~/features/tools/model/structured-data.types";

/**
 * FAQs for the Orçamento 50/30/20 calculator, exposed as visible content and JSON-LD.
 */
export const ORCAMENTO_5030_FAQS: readonly ToolFaqEntry[] = [
  {
    question: "Como funciona a regra 50/30/20?",
    answer:
      "A regra divide sua renda líquida em três blocos: 50% para necessidades, 30% para desejos e 20% para investimentos ou quitação de dívidas. Ela funciona como ponto de partida para enxergar se seu orçamento está equilibrado.",
  },
  {
    question: "O que entra em necessidades?",
    answer:
      "Necessidades são gastos essenciais para manter sua rotina: moradia, alimentação, transporte, saúde, educação básica, contas de consumo e dívidas obrigatórias. Se essa fatia passa de 50%, vale revisar contratos e gastos fixos antes de cortar lazer.",
  },
  {
    question: "Posso adaptar os percentuais?",
    answer:
      "Sim. Quem mora em cidade cara, sustenta família ou tem renda variável pode precisar ajustar as faixas. O importante é preservar uma meta clara de reserva, investimento ou redução de dívida para que o orçamento gere progresso financeiro.",
  },
  {
    question: "A regra 50/30/20 serve para renda variável?",
    answer:
      "Serve, mas com uma camada extra de prudência. Use a média dos últimos meses ou uma renda conservadora como base e direcione excedentes para reserva de emergência antes de aumentar gastos recorrentes.",
  },
];
