/**
 * Feature keys that can be checked against the entitlements API.
 *
 * - basic_simulations: available on the free plan
 * - wallet_read: available on the free plan
 * - advanced_simulations: requires premium subscription
 * - export_pdf: requires premium subscription
 * - shared_entries: requires premium subscription
 */
export type FeatureKey =
  | "basic_simulations"
  | "advanced_simulations"
  | "export_pdf"
  | "shared_entries"
  | "wallet_read";
