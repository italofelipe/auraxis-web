import type { CreditCardDto } from "../contracts/credit-card.dto";
import type { TagDto } from "~/features/tags/contracts/tag.dto";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";
import type { EnrichedTransaction } from "../utils/transaction-billing";

/** Cartões fictícios para stories. */
export const STORY_CARDS: CreditCardDto[] = [
  { id: "inter", name: "Inter", brand: "mastercard", limit_amount: 25000, closing_day: 5, due_day: 10, bank: "Inter", description: null, benefits: ["Cashback"], created_at: null, updated_at: null },
  { id: "nubank", name: "Nubank", brand: "mastercard", limit_amount: 13950, closing_day: 30, due_day: 7, bank: "Nubank", description: null, benefits: null, created_at: null, updated_at: null },
  { id: "mp", name: "Mercado Pago", brand: "visa", limit_amount: 8000, closing_day: 5, due_day: 10, bank: "Mercado Pago", description: null, benefits: null, created_at: null, updated_at: null },
];

/** Categorias fictícias para stories. */
export const STORY_TAGS: TagDto[] = [
  { id: "alimentacao", name: "Alimentação", color: "#11A36B", icon: null },
  { id: "transporte", name: "Transporte", color: "#2E7CF6", icon: null },
  { id: "compras", name: "Compras", color: "#9B5DE5", icon: null },
  { id: "lazer", name: "Lazer", color: "#F15BB5", icon: null },
  { id: "assinaturas", name: "Assinaturas", color: "#FF8A3D", icon: null },
];

let sequence = 0;

/**
 * Builds an EnrichedTransaction for fixtures.
 *
 * @param partial Fields to override.
 * @returns Enriched transaction.
 */
const etx = (partial: Partial<EnrichedTransaction>): EnrichedTransaction => {
  sequence += 1;
  const id = `tx-${sequence}`;
  return {
    transaction: { id } as TransactionDto,
    id,
    title: "Compra",
    amount: 100,
    purchaseDate: "2026-06-12",
    tagId: "compras",
    creditCardId: "inter",
    billMonth: "2026-06",
    isInstallment: false,
    installmentCount: null,
    installmentGroupId: null,
    isRecurring: false,
    status: "pending",
    ...partial,
  };
};

/** Transações enriquecidas fictícias cobrindo jun/2026 e meses anteriores. */
export const STORY_TXS: EnrichedTransaction[] = [
  etx({ title: "Mercado Pão de Açúcar", amount: 642.9, tagId: "alimentacao", creditCardId: "inter", billMonth: "2026-06", purchaseDate: "2026-06-03" }),
  etx({ title: "iFood", amount: 89.5, tagId: "alimentacao", creditCardId: "nubank", billMonth: "2026-06", purchaseDate: "2026-06-08" }),
  etx({ title: "Uber", amount: 47.3, tagId: "transporte", creditCardId: "inter", billMonth: "2026-06", purchaseDate: "2026-06-09" }),
  etx({ title: "Posto Shell", amount: 320, tagId: "transporte", creditCardId: "mp", billMonth: "2026-06", purchaseDate: "2026-06-02" }),
  etx({ title: "Amazon", amount: 1299, tagId: "compras", creditCardId: "inter", billMonth: "2026-06", purchaseDate: "2026-06-04", isInstallment: true, installmentCount: 6 }),
  etx({ title: "Zara", amount: 459.9, tagId: "compras", creditCardId: "nubank", billMonth: "2026-06", purchaseDate: "2026-06-06" }),
  etx({ title: "Cinemark", amount: 96, tagId: "lazer", creditCardId: "mp", billMonth: "2026-06", purchaseDate: "2026-06-07" }),
  etx({ title: "Spotify", amount: 21.9, tagId: "assinaturas", creditCardId: "inter", billMonth: "2026-06", purchaseDate: "2026-06-01" }),
  etx({ title: "Netflix", amount: 44.9, tagId: "assinaturas", creditCardId: "nubank", billMonth: "2026-06", purchaseDate: "2026-06-05" }),
  etx({ title: "Farmácia", amount: 132.4, tagId: null, creditCardId: "inter", billMonth: "2026-06", purchaseDate: "2026-06-10" }),
  // Meses anteriores (para tendência e variação)
  etx({ title: "Mercado", amount: 510, tagId: "alimentacao", creditCardId: "inter", billMonth: "2026-05", purchaseDate: "2026-05-03" }),
  etx({ title: "Amazon", amount: 216.5, tagId: "compras", creditCardId: "inter", billMonth: "2026-05", purchaseDate: "2026-05-04", isInstallment: true, installmentCount: 6 }),
  etx({ title: "Uber", amount: 180, tagId: "transporte", creditCardId: "nubank", billMonth: "2026-05", purchaseDate: "2026-05-09" }),
  etx({ title: "Mercado", amount: 470, tagId: "alimentacao", creditCardId: "inter", billMonth: "2026-04", purchaseDate: "2026-04-03" }),
  etx({ title: "Loja", amount: 350, tagId: "compras", creditCardId: "mp", billMonth: "2026-04", purchaseDate: "2026-04-10" }),
  etx({ title: "Posto", amount: 290, tagId: "transporte", creditCardId: "mp", billMonth: "2026-03", purchaseDate: "2026-03-02" }),
];
