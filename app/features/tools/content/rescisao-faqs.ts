import type { ToolFaqEntry } from "~/features/tools/model/structured-data.types";

/**
 * Base FAQs exposed as JSON-LD (FAQPage) for the Rescisão CLT calculator.
 */
export const RESCISAO_FAQS: readonly ToolFaqEntry[] = [
  {
    question: "O que o trabalhador recebe em uma demissão sem justa causa?",
    answer:
      "Saldo de salário, aviso prévio (trabalhado ou indenizado), 13º salário proporcional, férias vencidas e proporcionais (com 1/3), FGTS do mês, multa de 40% sobre o FGTS depositado e acesso ao seguro-desemprego se cumprir os requisitos.",
  },
  {
    question: "O que é aviso prévio indenizado?",
    answer:
      "Quando o empregador dispensa o trabalhador mas não exige o cumprimento do aviso prévio, ele paga o valor correspondente em dinheiro. O tempo do aviso indenizado conta para fins de contagem do tempo de serviço, 13º e férias proporcionais.",
  },
  {
    question: "Qual a duração do aviso prévio?",
    answer:
      "Mínimo de 30 dias, acrescidos de 3 dias por ano completo trabalhado na mesma empresa, até o limite de 90 dias. Por exemplo, quem trabalhou 10 anos tem direito a 60 dias (30 + 30) de aviso.",
  },
  {
    question: "Em pedido de demissão o trabalhador recebe menos?",
    answer:
      "Sim. No pedido de demissão não há multa de FGTS, não há acesso ao seguro-desemprego e o trabalhador precisa cumprir o aviso prévio (ou ter o valor descontado das verbas). Ele mantém o direito a saldo de salário, 13º e férias proporcionais.",
  },
  {
    question: "Como é a rescisão por acordo entre as partes?",
    answer:
      "Introduzida em 2017, permite rescisão consensual com valores intermediários: o trabalhador recebe metade do aviso prévio indenizado e metade da multa do FGTS (20%), pode sacar até 80% do FGTS, mas não tem acesso ao seguro-desemprego.",
  },
];
