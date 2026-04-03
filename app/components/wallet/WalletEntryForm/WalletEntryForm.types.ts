import type { WalletEntryDto } from "~/features/portfolio/contracts/portfolio.dto";

/**
 * Props accepted by the WalletEntryForm component.
 */
export interface WalletEntryFormProps {
  /** Controls the NModal open/close state. */
  visible: boolean;
  /**
   * When provided, the form opens in "edit" mode pre-filled with the entry's data.
   * On submit the form emits `edit` instead of `submit`.
   */
  initialEntry?: WalletEntryDto | null;
}
