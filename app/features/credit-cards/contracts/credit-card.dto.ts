export type CreditCardDto = {
  readonly id: string;
  readonly name: string;
};

export type CreateCreditCardPayload = {
  readonly name: string;
};

export type UpdateCreditCardPayload = {
  readonly name: string;
};
