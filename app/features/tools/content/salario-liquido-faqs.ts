import type { ToolFaqEntry } from "~/features/tools/model/structured-data.types";

/**
 * FAQs for the Salário Líquido CLT calculator, exposed as JSON-LD (FAQPage).
 */
export const SALARIO_LIQUIDO_FAQS: readonly ToolFaqEntry[] = [
  {
    question: "Como é calculado o INSS descontado do salário?",
    answer:
      "O INSS é calculado de forma progressiva sobre o salário bruto. Em 2025, as faixas são: 7,5% até R$ 1.518,00; 9% de R$ 1.518,01 a R$ 2.793,88; 12% de R$ 2.793,89 a R$ 4.190,83; e 14% de R$ 4.190,84 a R$ 8.157,41. O desconto máximo mensal (teto) é de aproximadamente R$ 908,86.",
  },
  {
    question: "O que é o IRRF e como ele é descontado?",
    answer:
      "O IRRF (Imposto de Renda Retido na Fonte) é o desconto de IR aplicado diretamente na folha de pagamento. A base de cálculo é o salário bruto menos o INSS e a dedução por dependentes (R$ 189,59 cada em 2025). A alíquota varia de 0% (até R$ 2.259,20) a 27,5% (acima de R$ 4.664,68).",
  },
  {
    question: "Qual é o custo real do empregador para contratar um funcionário CLT?",
    answer:
      "Além do salário bruto, o empregador paga 20% de INSS patronal e 8% de FGTS, totalizando 28% de encargos sobre o salário. Por exemplo, para um salário bruto de R$ 5.000, o custo total para o empregador é de R$ 6.400. Isso não inclui benefícios obrigatórios como vale-transporte e eventuais adicionais.",
  },
  {
    question: "O que é o Vale-Transporte e como funciona o desconto?",
    answer:
      "O Vale-Transporte é um benefício obrigatório para CLT. O empregado pode contribuir com até 6% do salário bruto para custeio do VT; o excedente fica a cargo do empregador. Caso não utilize transporte público, o empregado pode optar por não receber o benefício, zerando o desconto.",
  },
  {
    question: "Como os dependentes afetam o imposto de renda descontado na fonte?",
    answer:
      "Cada dependente declarado reduz a base de cálculo do IRRF em R$ 189,59 (valor de 2025). Por exemplo, com 2 dependentes, a base de cálculo cai R$ 379,18, podendo reduzir ou até zerar o imposto devido, dependendo do salário. A declaração é feita pelo formulário de dependentes no RH.",
  },
];
