import type { ToolFaqEntry } from "~/features/tools/model/structured-data.types";

/**
 * FAQs for the Reserva de Emergência calculator, exposed as JSON-LD (FAQPage).
 */
export const RESERVA_EMERGENCIA_FAQS: readonly ToolFaqEntry[] = [
  {
    question: "Quanto devo guardar na reserva de emergência?",
    answer:
      "O valor ideal depende do seu perfil profissional. Para CLT estável, recomenda-se 6 meses de despesas. Para CLT instável ou comissionista, 9 meses. Para autônomos e PJ, 12 meses. Aposentados devem manter 3 meses, pois possuem renda previsível. O cálculo é simples: multiplique suas despesas mensais fixas pelo número de meses recomendado para seu perfil.",
  },
  {
    question: "Onde investir a reserva de emergência?",
    answer:
      "A reserva de emergência deve estar em investimentos de alta liquidez e baixo risco: Tesouro Selic (liquidez diária, rendimento próximo à Selic), CDB com liquidez diária (100% CDI ou mais), Fundo DI de baixa taxa ou conta remunerada de banco digital. Evite deixar na poupança, cujo rendimento é menor, ou em investimentos sem liquidez.",
  },
  {
    question: "Posso usar a reserva de emergência para investir?",
    answer:
      "Não. A reserva de emergência é intocável exceto em situações de urgência real: perda de emprego, problemas de saúde, reparos essenciais. Usá-la para investimentos deixa você vulnerável e pode forçar o resgate de investimentos de longo prazo em péssimos momentos. Só invista o que excede sua reserva.",
  },
  {
    question: "Como calcular meu prazo para atingir a reserva?",
    answer:
      "O prazo depende de três fatores: quanto falta para atingir a meta (gap), quanto você consegue poupar por mês (aporte mensal) e a rentabilidade do investimento escolhido (juros compostos). Por exemplo, para uma meta de R$ 18.000 com aporte mensal de R$ 1.000 e rendimento de 1% ao mês, o prazo seria de aproximadamente 16 meses.",
  },
  {
    question: "O que muda na reserva de emergência para autônomos e PJ?",
    answer:
      "Autônomos e PJ não possuem proteções como seguro-desemprego, FGTS ou estabilidade contratual. Por isso, precisam de uma reserva maior (12 meses de despesas) que cubra não só despesas pessoais, mas também custos fixos do negócio durante períodos de baixa receita. O planejamento financeiro para esses perfis deve ser mais conservador.",
  },
];
