import type { ToolFaqEntry } from "~/features/tools/model/structured-data.types";

/**
 * Base FAQs exposed as JSON-LD (FAQPage) for the FGTS simulator.
 */
export const FGTS_FAQS: readonly ToolFaqEntry[] = [
  {
    question: "Qual a alíquota que o empregador deposita no FGTS?",
    answer:
      "O empregador deposita 8% do salário bruto na conta vinculada do FGTS todos os meses. Para menor aprendiz, a alíquota é reduzida para 2%.",
  },
  {
    question: "Qual é o rendimento do saldo do FGTS?",
    answer:
      "O saldo do FGTS rende TR + 3% ao ano, mais a distribuição anual de lucros do fundo (quando houver). Historicamente, o rendimento fica abaixo da inflação, o que torna o FGTS um dos rendimentos mais baixos disponíveis.",
  },
  {
    question: "Quando posso sacar o FGTS?",
    answer:
      "O saque integral é possível em casos como demissão sem justa causa, aposentadoria, doenças graves e compra da casa própria. Também existem modalidades específicas: saque-aniversário (percentual anual) e saque emergencial (quando decretado pelo governo).",
  },
  {
    question: "Qual a multa rescisória por demissão sem justa causa?",
    answer:
      "A multa é de 40% sobre o saldo depositado durante o contrato de trabalho, paga pelo empregador diretamente na conta do FGTS no momento da rescisão, além de uma contribuição social de 10% que não vai para o trabalhador.",
  },
  {
    question: "Vale a pena aderir ao saque-aniversário?",
    answer:
      "Depende do seu cenário. O saque-aniversário dá acesso a um percentual anual do saldo, mas impede o saque integral em caso de demissão. Para quem tem alta probabilidade de ser demitido em breve, não compensa. Para quem está estável e quer liquidez moderada, pode fazer sentido.",
  },
];
