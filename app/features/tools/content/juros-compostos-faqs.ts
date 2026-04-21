import type { ToolFaqEntry } from "~/features/tools/model/structured-data.types";

/**
 * Base FAQs exposed as JSON-LD (FAQPage) for the Juros Compostos calculator.
 * Answers are plain language — no HTML required.
 */
export const JUROS_COMPOSTOS_FAQS: readonly ToolFaqEntry[] = [
  {
    question: "Qual a diferença entre juros compostos e juros simples?",
    answer:
      "No regime de juros simples, os juros incidem apenas sobre o capital inicial. Nos juros compostos, os juros de cada período passam a compor o montante e também rendem juros no período seguinte — é o efeito 'juros sobre juros' que acelera o crescimento no longo prazo.",
  },
  {
    question: "Como o aporte mensal influencia o resultado?",
    answer:
      "Cada aporte mensal é somado ao saldo e passa a render juros a partir do mês em que é depositado. Quanto maior o aporte e mais cedo ele começa, maior o montante final — o tempo é o fator mais decisivo em juros compostos.",
  },
  {
    question: "O que é a taxa real e por que ela importa?",
    answer:
      "A taxa real é a rentabilidade descontada a inflação, calculada pela fórmula de Fisher: (1 + nominal) / (1 + inflação) − 1. Ela mostra o poder de compra que seu capital efetivamente ganhou e é o número que importa para planejar metas de longo prazo.",
  },
  {
    question: "Posso usar essa calculadora para investimentos renda fixa?",
    answer:
      "Sim. Para títulos prefixados ou pós-fixados (CDI, Selic, IPCA+), use a taxa nominal esperada como entrada. Lembre de descontar o IR aplicável e, se quiser a rentabilidade líquida, considere também os custos do investimento.",
  },
  {
    question: "Como escolher entre aportes mensais e um aporte único?",
    answer:
      "Aportes mensais reduzem o risco de timing e aproveitam o custo médio. Um aporte único rende mais quando o período é longo e a taxa é estável, mas concentra o risco no momento da entrada. Em geral, aportes mensais consistentes batem tentativas de acertar o melhor momento.",
  },
];
