import type { TransactionTypeDto } from "~/features/transactions/contracts/transaction.dto";

/**
 * Props accepted by the QuickTransactionForm component.
 */
export interface QuickTransactionFormProps {
  /** Whether the modal is currently visible. */
  readonly visible: boolean;

  /** Determines the form layout and API payload type. */
  readonly type: TransactionTypeDto;
}
