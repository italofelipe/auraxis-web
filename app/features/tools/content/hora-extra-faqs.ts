import type { ToolFaqEntry } from "~/features/tools/model/structured-data.types";

/**
 * Base FAQs exposed as JSON-LD (FAQPage) for the Hora Extra CLT calculator.
 */
export const HORA_EXTRA_FAQS: readonly ToolFaqEntry[] = [
  {
    question: "Qual o adicional mínimo para hora extra CLT?",
    answer:
      "A Constituição garante adicional mínimo de 50% sobre o valor da hora normal em dias úteis. Em domingos e feriados, o adicional sobe para 100%. Muitas convenções coletivas preveem percentuais maiores (60%, 75%).",
  },
  {
    question: "Como é calculado o valor da hora normal?",
    answer:
      "O valor da hora normal é obtido dividindo o salário mensal pelo total de horas contratadas no mês — em geral, 220 horas para jornada de 44h semanais ou 200 horas para jornada de 40h semanais.",
  },
  {
    question: "Hora extra entra no cálculo de 13º, férias e FGTS?",
    answer:
      "Sim. A média das horas extras recebidas nos últimos 12 meses integra a remuneração para cálculo de 13º, férias e também incide sobre o FGTS depositado pelo empregador.",
  },
  {
    question: "Banco de horas é a mesma coisa que hora extra?",
    answer:
      "Não. No banco de horas, as horas trabalhadas além da jornada são compensadas com folgas em outros dias, sem pagamento adicional. Já a hora extra é paga com acréscimo. A adoção de banco de horas exige acordo coletivo ou individual formal.",
  },
  {
    question: "Posso recusar hora extra?",
    answer:
      "Em regra, sim — exceto em casos de força maior ou necessidade imperiosa previstos na CLT. Recusas habituais podem gerar conflito com o empregador, mas não justificam demissão por justa causa isoladamente.",
  },
];
