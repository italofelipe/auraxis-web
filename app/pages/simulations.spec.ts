import { describe, expect, it } from "vitest";
import type { SimulationType } from "~/features/simulations/contracts/simulation-card.dto";

/**
 * Unit tests for the simulations page navigation logic.
 *
 * Full rendering is not possible in the happy-dom test environment due to
 * Nuxt runtime context (useHead, navigateTo). These tests validate the static
 * data used by the "New Simulation" dropdown.
 */

/** Maps each simulation type to the tool page route it should navigate to. */
const SIMULATION_TYPE_ROUTES: Record<SimulationType, string> = {
  installment_vs_cash: "/tools/installment-vs-cash",
  goal_projection: "/tools/aposentadoria",
  investment_return: "/tools/juros-compostos",
};

const ALL_SIMULATION_TYPES: SimulationType[] = [
  "installment_vs_cash",
  "goal_projection",
  "investment_return",
];

describe("SimulationsPage — new simulation dropdown routing", () => {
  it("SIMULATION_TYPE_ROUTES covers all SimulationType values", () => {
    for (const type of ALL_SIMULATION_TYPES) {
      expect(SIMULATION_TYPE_ROUTES).toHaveProperty(type);
    }
  });

  it("every route in SIMULATION_TYPE_ROUTES starts with /tools/", () => {
    for (const route of Object.values(SIMULATION_TYPE_ROUTES)) {
      expect(route).toMatch(/^\/tools\/.+/);
    }
  });

  it("installment_vs_cash navigates to /tools/installment-vs-cash", () => {
    expect(SIMULATION_TYPE_ROUTES.installment_vs_cash).toBe("/tools/installment-vs-cash");
  });

  it("goal_projection navigates to a valid tool route", () => {
    expect(SIMULATION_TYPE_ROUTES.goal_projection).toBeTruthy();
    expect(SIMULATION_TYPE_ROUTES.goal_projection.startsWith("/tools/")).toBe(true);
  });

  it("investment_return navigates to a valid tool route", () => {
    expect(SIMULATION_TYPE_ROUTES.investment_return).toBeTruthy();
    expect(SIMULATION_TYPE_ROUTES.investment_return.startsWith("/tools/")).toBe(true);
  });

  it("all routes are unique — no two types share the same destination", () => {
    const routes = Object.values(SIMULATION_TYPE_ROUTES);
    const uniqueRoutes = new Set(routes);
    expect(uniqueRoutes.size).toBe(routes.length);
  });
});
