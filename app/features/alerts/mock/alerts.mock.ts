import type { AlertDto } from "../contracts/alert.dto";

/**
 * Mock alerts for development and Storybook usage.
 * Contains 8 alerts with varied types and read/unread states.
 */
export const MOCK_ALERTS: AlertDto[] = [
  {
    id: "alert-001",
    type: "goal_achieved",
    title: "Meta atingida: Reserva de emergência",
    description: "Parabéns! Você atingiu 100% da sua meta de reserva de emergência de R$ 30.000.",
    created_at: "2026-03-25T10:30:00Z",
    is_read: false,
  },
  {
    id: "alert-002",
    type: "goal_achieved",
    title: "Meta atingida: Notebook novo",
    description: "Você concluiu a meta 'Notebook novo'. O valor alvo de R$ 18.000 foi alcançado.",
    created_at: "2026-03-20T14:00:00Z",
    is_read: true,
  },
  {
    id: "alert-003",
    type: "overdue_payment",
    title: "Pagamento atrasado: Fatura cartão de crédito",
    description: "A fatura do seu cartão no valor de R$ 1.250,00 está atrasada há 3 dias.",
    created_at: "2026-03-24T08:00:00Z",
    is_read: false,
  },
  {
    id: "alert-004",
    type: "overdue_payment",
    title: "Pagamento atrasado: Conta de luz",
    description: "A conta de energia elétrica de R$ 320,00 venceu ontem e ainda não foi paga.",
    created_at: "2026-03-26T09:00:00Z",
    is_read: false,
  },
  {
    id: "alert-005",
    type: "budget_exceeded",
    title: "Orçamento excedido: Alimentação",
    description: "Você já gastou R$ 1.850,00 em alimentação este mês, ultrapassando o limite de R$ 1.500,00.",
    created_at: "2026-03-22T16:45:00Z",
    is_read: true,
  },
  {
    id: "alert-006",
    type: "investment_opportunity",
    title: "Oportunidade de investimento: CDB 14,5% ao ano",
    description: "Um novo CDB com liquidez diária e taxa de 14,5% ao ano está disponível na sua corretora.",
    created_at: "2026-03-21T11:00:00Z",
    is_read: false,
  },
  {
    id: "alert-007",
    type: "system",
    title: "Atualização de termos de uso",
    description: "Os termos de uso e política de privacidade foram atualizados. Revise as mudanças antes de continuar.",
    created_at: "2026-03-18T08:00:00Z",
    is_read: true,
  },
  {
    id: "alert-008",
    type: "system",
    title: "Manutenção programada",
    description: "O sistema passará por manutenção no dia 30/03 das 02h às 04h. Salve seus dados antes.",
    created_at: "2026-03-15T12:00:00Z",
    is_read: false,
  },
];
