import type { PortfolioSummaryDto } from "~/features/portfolio/contracts/portfolio.dto";

export type PortfolioSummaryBarProps = {
  summary: PortfolioSummaryDto | null;
  loading?: boolean;
};
