import type { Simulation } from "~/features/simulations/model/simulation";
import type { SimulationCardDto, SimulationType } from "~/features/simulations/contracts/simulation-card.dto";

const SLUG_TO_TYPE: Record<string, SimulationType> = {
  installment_vs_cash: "installment_vs_cash",
  goal_projection: "goal_projection",
  investment_return: "investment_return",
};

/**
 * Derives the SimulationType from the tool_slug stored on the Simulation model.
 * Falls back to "installment_vs_cash" for unrecognised slugs.
 *
 * @param toolSlug - The slug string stored on the API model.
 * @returns The matching SimulationType union value.
 */
const resolveType = (toolSlug: string): SimulationType =>
  SLUG_TO_TYPE[toolSlug] ?? "installment_vs_cash";

/**
 * Extracts the human-readable summary from the simulation result payload.
 * Returns a fallback string when the result does not carry a summary field.
 *
 * @param result - The opaque result object returned by the API.
 * @param name - Simulation name used as fallback.
 * @returns Summary string.
 */
const extractSummary = (result: unknown, name: string): string => {
  if (result !== null && typeof result === "object") {
    const r = result as Record<string, unknown>;
    if (typeof r["summary"] === "string" && r["summary"].length > 0) {
      return r["summary"];
    }
  }
  return name;
};

/**
 * Extracts the primary numeric result value from the simulation result payload.
 * Returns null when the result does not carry a recognisable numeric value.
 *
 * @param result - The opaque result object returned by the API.
 * @returns Primary result number or null.
 */
const extractResultValue = (result: unknown): number | null => {
  if (result !== null && typeof result === "object") {
    const r = result as Record<string, unknown>;
    if (typeof r["result_value"] === "number") {return r["result_value"];}
    if (typeof r["value"] === "number") {return r["value"];}
  }
  return null;
};

/**
 * Maps a Simulation domain model to a SimulationCardDto suitable for display.
 *
 * @param simulation - The domain model returned by the API.
 * @returns SimulationCardDto ready for the SimulationCard component.
 */
export const mapToSimulationCardDto = (simulation: Simulation): SimulationCardDto => ({
  id: simulation.id,
  name: simulation.name,
  type: resolveType(simulation.toolSlug),
  created_at: simulation.createdAt,
  summary: extractSummary(simulation.result, simulation.name),
  result_value: extractResultValue(simulation.result),
});
