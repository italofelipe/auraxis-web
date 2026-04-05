import { defineNuxtRouteMiddleware, navigateTo } from "#app";
import { isFeatureEnabled } from "~/shared/feature-flags";

/**
 * Maps route paths to their controlling feature flag key.
 *
 * When a flag is absent from this map or its status is not "enabled-prod",
 * the middleware redirects to /coming-soon so users see a placeholder instead
 * of a broken or incomplete page.
 *
 * To enable a route: set its flag status to "enabled-prod" in
 * config/feature-flags.json.
 */
const ROUTE_FLAG_MAP: Record<string, string> = {
  "/portfolio": "web.pages.portfolio",
  "/goals": "web.pages.goals",
  "/alerts": "web.pages.alerts",
  "/simulations": "web.pages.simulations",
  "/shared-entries": "web.pages.shared-entries",
  "/income": "web.pages.income",
  "/investor-profile": "web.pages.investor-profile",
  "/settings/accounts": "web.pages.settings.accounts",
  "/settings/credit-cards": "web.pages.settings.credit-cards",
  "/settings/tags": "web.pages.settings.tags",
  "/transactions": "web.pages.transactions",
};

export default defineNuxtRouteMiddleware((to) => {
  const flagKey = ROUTE_FLAG_MAP[to.path];

  if (!flagKey) {
    return undefined;
  }

  if (!isFeatureEnabled(flagKey)) {
    return navigateTo("/coming-soon");
  }

  return undefined;
});
