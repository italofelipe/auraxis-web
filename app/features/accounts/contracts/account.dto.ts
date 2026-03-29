export type AccountDto = {
  readonly id: string;
  readonly name: string;
};

export type CreateAccountPayload = {
  readonly name: string;
};

export type UpdateAccountPayload = {
  readonly name: string;
};
