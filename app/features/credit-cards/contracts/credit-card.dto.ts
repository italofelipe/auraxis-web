export type CreditCardBrand = "visa" | "mastercard" | "elo" | "hipercard" | "amex" | "other";

export type CreditCardDto = {
  readonly id: string;
  readonly name: string;
  readonly brand: CreditCardBrand | null;
  readonly limit_amount: number | null;
  readonly closing_day: number | null;
  readonly due_day: number | null;
  // cc-4 (#864) — campos estendidos do Sprint 1 do backend.
  readonly bank: string | null;
  readonly description: string | null;
  readonly benefits: readonly string[] | null;
  readonly last_four_digits?: string | null;
  readonly validity_date?: string | null;
  readonly created_at: string | null;
  readonly updated_at: string | null;
};

export type CreateCreditCardPayload = {
  readonly name: string;
  readonly brand?: CreditCardBrand | null;
  readonly limit_amount?: number | null;
  readonly closing_day?: number | null;
  readonly due_day?: number | null;
  readonly bank?: string | null;
  readonly description?: string | null;
  readonly benefits?: readonly string[] | null;
};

/** Limite de benefits aceito pelo backend (cc-4). */
export const CREDIT_CARD_BENEFITS_MAX = 12;

// ---------------------------------------------------------------------------
// Bill + Utilization (cc-4 / #864) — GET /credit-cards/:id/bill | /utilization
// ---------------------------------------------------------------------------

export interface BillCycle {
  readonly startDate: string;
  readonly endDate: string;
  readonly dueDate: string;
  /** Status do ciclo, conforme o backend (open/closed/...). */
  readonly status: string;
}

export interface BillTransaction {
  readonly id: string;
  readonly title: string;
  readonly amount: number;
  readonly dueDate: string | null;
  readonly status: string;
  readonly type: string;
  readonly impactPolicy: "full" | "cards_only" | "planned_until_bill";
}

/** View-model de domínio da fatura (valores já coagidos para number). */
export interface CreditCardBill {
  readonly cycle: BillCycle;
  readonly transactions: readonly BillTransaction[];
  readonly totalAmount: number;
  readonly paidAmount: number;
  readonly pendingAmount: number;
}

/** View-model de domínio da utilização do cartão. */
export interface CreditCardUtilization {
  readonly cycle: BillCycle;
  readonly committedAmount: number;
  readonly availableAmount: number | null;
  readonly limitAmount: number | null;
  /** Percentual 0..100+ (pode passar de 100 quando estourado). */
  readonly utilizationPct: number;
}

// ── Raw DTOs (snake_case, valores monetários como string Decimal) ──────────

interface BillCycleRaw {
  readonly start_date: string;
  readonly end_date: string;
  readonly due_date: string;
  readonly status: string;
}

interface BillTransactionRaw {
  readonly id: string;
  readonly title: string;
  readonly amount: string;
  readonly due_date: string | null;
  readonly status: string;
  readonly type: string;
  readonly impact_policy?: "full" | "cards_only" | "planned_until_bill";
}

interface CreditCardBillRaw {
  readonly cycle: BillCycleRaw;
  readonly transactions: readonly BillTransactionRaw[];
  readonly total_amount: string;
  readonly paid_amount: string;
  readonly pending_amount: string;
}

interface CreditCardUtilizationRaw {
  readonly cycle: BillCycleRaw;
  readonly committed_amount: string;
  readonly available_amount: string | null;
  readonly limit_amount: string | null;
  readonly utilization_pct: number;
}

type Enveloped<T> = T | { readonly data?: T | null };

/**
 * Desembrulha o envelope `{ data }` quando presente.
 *
 * @param payload Resposta crua (flat ou envelope).
 * @returns O payload interno, ou null.
 */
const unwrap = <T>(payload: Enveloped<T>): T | null => {
  if (payload !== null && typeof payload === "object" && "data" in payload) {
    return (payload as { data?: T | null }).data ?? null;
  }
  return payload as T;
};

/**
 * Coage string Decimal para number (0 quando inválido).
 *
 * @param value String monetária.
 * @returns Número finito.
 */
const toNumber = (value: string | null | undefined): number => {
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Coage string para number preservando null.
 *
 * @param value String monetária ou null.
 * @returns Número, ou null quando ausente/inválido.
 */
const toNullableNumber = (value: string | null | undefined): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Converte o ciclo cru (snake_case) para camelCase.
 *
 * @param raw Ciclo cru do backend.
 * @returns Ciclo de domínio.
 */
const toCycle = (raw: BillCycleRaw): BillCycle => ({
  startDate: raw.start_date,
  endDate: raw.end_date,
  dueDate: raw.due_date,
  status: raw.status,
});

/**
 * Normaliza o payload de bill (flat legacy ou envelope `data`) para o domínio.
 *
 * @param payload Corpo da resposta de /credit-cards/:id/bill.
 * @returns View-model de fatura tipado.
 */
export const toCreditCardBill = (
  payload: Enveloped<CreditCardBillRaw>,
): CreditCardBill => {
  const raw = unwrap(payload);
  return {
    cycle: toCycle(raw!.cycle),
    transactions: (raw?.transactions ?? []).map((tx) => ({
      id: tx.id,
      title: tx.title,
      amount: toNumber(tx.amount),
      dueDate: tx.due_date,
      status: tx.status,
      type: tx.type,
      impactPolicy: tx.impact_policy ?? "full",
    })),
    totalAmount: toNumber(raw?.total_amount),
    paidAmount: toNumber(raw?.paid_amount),
    pendingAmount: toNumber(raw?.pending_amount),
  };
};

/**
 * Normaliza o payload de utilization (flat legacy ou envelope `data`).
 *
 * @param payload Corpo da resposta de /credit-cards/:id/utilization.
 * @returns View-model de utilização tipado.
 */
export const toCreditCardUtilization = (
  payload: Enveloped<CreditCardUtilizationRaw>,
): CreditCardUtilization => {
  const raw = unwrap(payload);
  return {
    cycle: toCycle(raw!.cycle),
    committedAmount: toNumber(raw?.committed_amount),
    availableAmount: toNullableNumber(raw?.available_amount),
    limitAmount: toNullableNumber(raw?.limit_amount),
    utilizationPct: typeof raw?.utilization_pct === "number" ? raw.utilization_pct : 0,
  };
};
