import type { CreditCardDto } from "../contracts/credit-card.dto";

export const MOCK_CREDIT_CARDS: CreditCardDto[] = [
  {
    id: "cc-1",
    name: "Cartão Nubank",
    brand: "mastercard",
    limit_amount: 5000,
    closing_day: 3,
    due_day: 10,
    bank: "Nubank",
    description: "Cartão principal",
    benefits: ["Cashback", "Sem anuidade"],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
  },
  {
    id: "cc-2",
    name: "Cartão Inter",
    brand: "mastercard",
    limit_amount: 3000,
    closing_day: 15,
    due_day: 22,
    bank: "Inter",
    description: null,
    benefits: null,
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-02-01T00:00:00Z",
  },
];
