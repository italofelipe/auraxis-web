import type { ToolFaqEntry } from "~/features/tools/model/structured-data.types";

/**
 * Base FAQs exposed as JSON-LD (FAQPage) for the Férias CLT calculator.
 */
export const FERIAS_FAQS: readonly ToolFaqEntry[] = [
  {
    question: "Quanto tempo de férias eu tenho direito?",
    answer:
      "Após 12 meses de trabalho (período aquisitivo), o trabalhador CLT tem direito a 30 dias corridos de férias, que podem ser fracionados em até três períodos mediante acordo — sendo um com no mínimo 14 dias e os demais com ao menos 5 dias cada.",
  },
  {
    question: "O que é o 1/3 constitucional sobre as férias?",
    answer:
      "É um adicional garantido pela Constituição equivalente a um terço da remuneração do período de férias. Ou seja, quem tira 30 dias de férias recebe o valor do salário acrescido de mais 1/3 desse valor.",
  },
  {
    question: "O que é o abono pecuniário?",
    answer:
      "É a possibilidade de converter até 10 dias de férias em dinheiro. O trabalhador tira 20 dias e recebe os 10 restantes como pagamento adicional. A solicitação deve ser feita até 15 dias antes do término do período aquisitivo.",
  },
  {
    question: "Há desconto de INSS e IR sobre as férias?",
    answer:
      "Sim. O total recebido (férias + 1/3 constitucional) entra na base de cálculo de INSS e IR do mês, com as mesmas alíquotas da folha regular. Em julho de 2020 o STF manteve a incidência do INSS sobre o 1/3, então ele não é mais isento.",
  },
  {
    question: "Posso tirar férias antes de completar 12 meses?",
    answer:
      "Não. As férias só podem ser concedidas após o período aquisitivo completo de 12 meses. A única exceção são as férias coletivas, quando a empresa pode antecipar o direito — mas, nesse caso, os trabalhadores com menos de 12 meses tiram apenas o proporcional.",
  },
];
