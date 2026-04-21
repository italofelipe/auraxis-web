import type { ToolFaqEntry } from "~/features/tools/model/structured-data.types";

/**
 * Base FAQs exposed as JSON-LD (FAQPage) for the CLT vs PJ calculator.
 */
export const CLT_VS_PJ_FAQS: readonly ToolFaqEntry[] = [
  {
    question: "Quais são os principais benefícios do regime CLT?",
    answer:
      "O trabalhador CLT tem férias remuneradas com 1/3, 13º salário, FGTS (8% do salário), multa de 40% em caso de demissão, seguro-desemprego, estabilidade em casos de gestação e doença, além de INSS como base previdenciária obrigatória.",
  },
  {
    question: "Quais vantagens o regime PJ oferece?",
    answer:
      "O PJ costuma receber remuneração bruta maior e pode optar por regimes tributários mais eficientes (Simples Nacional, Lucro Presumido). Tem flexibilidade de jornada e pode deduzir despesas operacionais. Em contrapartida, arca sozinho com férias, aposentadoria e reserva de emergência.",
  },
  {
    question: "O salário PJ precisa ser quanto para equivaler a um CLT?",
    answer:
      "Estimativas de mercado sugerem um acréscimo de 40% a 60% sobre o salário CLT para igualar benefícios e segurança. O valor exato depende do regime tributário, necessidade de plano de saúde e perfil de risco do profissional.",
  },
  {
    question: "Posso contribuir para o INSS sendo PJ?",
    answer:
      "Sim. Contribuintes individuais podem recolher INSS sobre base de 11% ou 20% do rendimento, respeitando o teto e o piso. A contribuição garante acesso a aposentadoria, auxílio-doença, salário-maternidade e pensão por morte.",
  },
  {
    question: "E a questão da 'pejotização'? É legal?",
    answer:
      "Quando o PJ presta serviços com pessoalidade, subordinação e habitualidade — características típicas de vínculo empregatício — a Justiça do Trabalho pode reconhecer a relação como CLT e determinar pagamento retroativo de encargos. Um PJ genuíno precisa ter autonomia real e múltiplos clientes ao longo do tempo.",
  },
];
