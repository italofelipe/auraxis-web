/**
 * Canonical tooltip copy for the public installment-vs-cash tool.
 * The content is intentionally concise so beginners get help without losing flow.
 */
export const INSTALLMENT_VS_CASH_TOOLTIP_COPY = {
  firstPaymentDelay:
    "Mostra em quantos dias a primeira parcela comeca. Quanto mais tarde ela começa, menor tende a ser o peso financeiro do parcelamento hoje.",
  opportunityRate:
    "Representa quanto o seu dinheiro poderia render no mesmo periodo se nao fosse usado agora na compra.",
  inflation:
    "Usamos a inflacao para estimar como o poder de compra do dinheiro muda ao longo do tempo.",
  extraFees:
    "Inclua tarifas, seguros, adesoes ou qualquer custo inicial que apareca junto do parcelamento.",
  presentValue:
    "Valor presente traduz as parcelas futuras para dinheiro de hoje, considerando a taxa de oportunidade informada.",
  realValueToday:
    "Poder de compra hoje estima quanto o parcelado pesa em termos reais depois do efeito da inflacao.",
  neutralityBand:
    "Quando a diferenca fica pequena demais, a Auraxis considera as opcoes equivalentes para evitar uma recomendacao forte sem lastro.",
  breakEvenDiscount:
    "Indica qual desconto a vista faria as duas opcoes empatarem nas premissas informadas.",
  breakEvenOpportunityRate:
    "Indica a taxa minima de oportunidade para que o parcelado passe a empatar com o pagamento a vista.",
  indicatorSnapshot:
    "Mostra a origem e a data-base do preset usado pela simulacao para que o resultado continue auditavel depois.",
} as const;

export type InstallmentVsCashTooltipKey =
  keyof typeof INSTALLMENT_VS_CASH_TOOLTIP_COPY;
