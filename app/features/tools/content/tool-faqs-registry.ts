import { CLT_VS_PJ_FAQS } from "./clt-vs-pj-faqs";
import { FERIAS_FAQS } from "./ferias-faqs";
import { FGTS_FAQS } from "./fgts-faqs";
import { HORA_EXTRA_FAQS } from "./hora-extra-faqs";
import { JUROS_COMPOSTOS_FAQS } from "./juros-compostos-faqs";
import { ORCAMENTO_5030_FAQS } from "./orcamento-50-30-20-faqs";
import { RESCISAO_FAQS } from "./rescisao-faqs";
import { RESERVA_EMERGENCIA_FAQS } from "./reserva-emergencia-faqs";
import { SALARIO_LIQUIDO_FAQS } from "./salario-liquido-faqs";
import type { ToolFaqEntry } from "~/features/tools/model/structured-data.types";

/**
 * FAQs por slug de calculadora (a chave é o segmento usado em `/tools/<slug>`).
 *
 * O registro existe para que a MESMA fonte alimente o FAQPage (JSON-LD) e o
 * bloco visível na página — o Google exige que o schema espelhe conteúdo que o
 * visitante consegue ler, e antes destas perguntas só existirem dentro do
 * `<script type="application/ld+json">` (#1223).
 */
export const TOOL_FAQS: Readonly<Record<string, readonly ToolFaqEntry[]>> = {
  "clt-vs-pj": CLT_VS_PJ_FAQS,
  "ferias": FERIAS_FAQS,
  "fgts": FGTS_FAQS,
  "hora-extra": HORA_EXTRA_FAQS,
  "juros-compostos": JUROS_COMPOSTOS_FAQS,
  "orcamento-50-30-20": ORCAMENTO_5030_FAQS,
  "rescisao": RESCISAO_FAQS,
  "reserva-emergencia": RESERVA_EMERGENCIA_FAQS,
  "salario-liquido": SALARIO_LIQUIDO_FAQS,
};

/**
 * Devolve as FAQs de uma calculadora.
 *
 * @param slug - Segmento da rota sob `/tools/`.
 * @returns Lista de perguntas; vazia quando a calculadora ainda não tem conteúdo.
 */
export const getToolFaqs = (slug: string): readonly ToolFaqEntry[] => TOOL_FAQS[slug] ?? [];
