export type CreditCardBrand = "visa" | "mastercard" | "elo" | "hipercard" | "amex" | "other";

export type CreditCardDto = {
  readonly id: string;
  readonly name: string;
  readonly brand: CreditCardBrand | null;
  readonly limit_amount: number | null;
  readonly closing_day: number | null;
  readonly due_day: number | null;
  readonly last_four_digits: string | null;
};

export type CreateCreditCardPayload = {
  readonly name: string;
  readonly brand?: CreditCardBrand | null;
  readonly limit_amount?: number | null;
  readonly closing_day?: number | null;
  readonly due_day?: number | null;
  readonly last_four_digits?: string | null;
};

export type UpdateCreditCardPayload = {
  readonly name: string;
  readonly brand?: CreditCardBrand | null;
  readonly limit_amount?: number | null;
  readonly closing_day?: number | null;
  readonly due_day?: number | null;
  readonly last_four_digits?: string | null;
};
