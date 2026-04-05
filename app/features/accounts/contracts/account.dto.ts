export type AccountType = "checking" | "savings" | "investment" | "wallet" | "other";

export type AccountDto = {
  readonly id: string;
  readonly name: string;
  readonly account_type: AccountType;
  readonly institution: string | null;
  readonly initial_balance: number;
};

export type CreateAccountPayload = {
  readonly name: string;
  readonly account_type: AccountType;
  readonly institution?: string | null;
  readonly initial_balance?: number;
};

export type UpdateAccountPayload = {
  readonly name: string;
  readonly account_type: AccountType;
  readonly institution?: string | null;
  readonly initial_balance?: number;
};
