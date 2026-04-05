import type { AccountDto } from "../contracts/account.dto";

export const MOCK_ACCOUNTS: AccountDto[] = [
  { id: "account-1", name: "Conta Corrente", account_type: "checking", institution: "Nubank", initial_balance: 1000 },
  { id: "account-2", name: "Conta Poupança", account_type: "savings", institution: "Itaú", initial_balance: 5000 },
  { id: "account-3", name: "Conta Investimentos", account_type: "investment", institution: null, initial_balance: 0 },
];
