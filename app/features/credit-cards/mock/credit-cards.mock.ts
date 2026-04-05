import type { CreditCardDto } from "../contracts/credit-card.dto";

export const MOCK_CREDIT_CARDS: CreditCardDto[] = [
  {
    id: "cc-1",
    name: "Cartão Nubank",
    brand: "mastercard",
    limit_amount: 5000,
    closing_day: 3,
    due_day: 10,
    last_four_digits: "1234",
  },
  {
    id: "cc-2",
    name: "Cartão Inter",
    brand: "mastercard",
    limit_amount: 3000,
    closing_day: 15,
    due_day: 22,
    last_four_digits: "5678",
  },
];
