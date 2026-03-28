import type { WalletEntryDto } from "../../contracts/portfolio.dto";

export type PortfolioTableProps = {
  entries: WalletEntryDto[];
  loading?: boolean;
};
