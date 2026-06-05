import type { TransactionTypeDto } from "~/features/transactions/contracts/transaction.dto";

/**
 * Props accepted by the QuickTransactionForm component.
 */
export interface QuickTransactionFormProps {
  /** Whether the modal is currently visible. */
  readonly visible: boolean;

  /** Determines the form layout and API payload type. */
  readonly type: TransactionTypeDto;

  /**
   * Pre-selects (and locks) a credit card. When set, the form seeds
   * `credit_card_id` with this value and renders the card field disabled, so
   * an expense launched from the dedicated Cartões area is always bound to the
   * card it was created from — installments included.
   */
  readonly presetCreditCardId?: string;
}
