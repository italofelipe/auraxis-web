import type { PortfolioSummaryDto } from "../../contracts/portfolio.dto";

export type PortfolioSummaryBarProps = {
  summary: PortfolioSummaryDto | null;
  loading?: boolean;
};
