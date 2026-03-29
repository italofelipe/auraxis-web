import type { WalletEntryDto } from "~/features/portfolio/contracts/portfolio.dto";

/**
 * Props accepted by the WalletPositionsPanel component.
 */
export interface WalletPositionsPanelProps {
  /** Array of wallet entry DTOs to display as position cards. */
  entries: WalletEntryDto[];
  /** Whether the data is currently being fetched. */
  isLoading?: boolean;
}
