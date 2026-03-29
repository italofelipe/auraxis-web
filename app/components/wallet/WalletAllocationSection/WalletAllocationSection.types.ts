import type { WalletEntryDto } from "~/features/portfolio/contracts/portfolio.dto";

/**
 * Props accepted by the WalletAllocationSection component.
 */
export interface WalletAllocationSectionProps {
  /** Array of wallet entry DTOs used to compute allocation breakdown. */
  entries: WalletEntryDto[];
  /** Whether the data is currently being fetched. */
  isLoading?: boolean;
}
