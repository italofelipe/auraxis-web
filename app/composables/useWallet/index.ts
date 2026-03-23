/**
 * Wallet composable facade.
 *
 * Thin re-export of useWalletSummaryQuery from the feature layer so that
 * pages and other composables can import from a stable, shallow path.
 */
export { useWalletSummaryQuery } from "~/features/wallet/queries/use-wallet-summary-query";
export type { WalletSummary, Position } from "~/features/wallet/model/wallet";
