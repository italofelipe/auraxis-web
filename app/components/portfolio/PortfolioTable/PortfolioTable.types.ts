import type { WalletEntryDto } from "~/features/portfolio/contracts/portfolio.dto";

export type PortfolioTableProps = {
  entries: WalletEntryDto[];
  loading?: boolean;
};

export type PortfolioTableEmits = {
  delete: [id: string];
  edit: [entry: WalletEntryDto];
};
