import type { SimulationCardDto, SimulationType } from "~/features/simulations/contracts/simulation-card.dto";
import type { Simulation } from "~/features/simulations/model/simulation";

/**
 * Maps canonical `tool_id` values (kebab-case, mirror of the backend
 * registry) to the legacy `SimulationType` discriminator used by the
 * `<SimulationCard />` component. The legacy snake_case `installment_vs_cash`
 * stays accepted for backwards compatibility with rows persisted before
 * the rename.
 */
const TOOL_ID_TO_TYPE: Record<string, SimulationType> = {
  "installment-vs-cash": "installment_vs_cash",
  installment_vs_cash: "installment_vs_cash",
  "goal-simulator": "goal_projection",
  "compound-interest": "investment_return",
  "thirteenth-salary": "investment_return",
  overtime: "investment_return",
};

/**
 *
 * @param toolId
 * @returns The computed value.
   */
const resolveType = (toolId: string): SimulationType =>
  TOOL_ID_TO_TYPE[toolId] ?? "installment_vs_cash";

/**
 * Extracts a human-readable label for the card from `metadata.label`,
 * a `summary` field on the result, or falls back to the tool id.
 * @param simulation
 * @returns The computed value.
   */
const extractLabel = (simulation: Simulation): string => {
  const metadataLabel = simulation.metadata?.label;
  if (typeof metadataLabel === "string" && metadataLabel.length > 0) {
    return metadataLabel;
  }
  const result = simulation.result;
  const summary = (result as Record<string, unknown>)["summary"];
  if (typeof summary === "string" && summary.length > 0) {
    return summary;
  }
  return simulation.toolId;
};

/**
 *
 * @param simulation
 * @param fallback
 * @returns The computed value.
   */
const extractSummary = (simulation: Simulation, fallback: string): string => {
  const result = simulation.result as Record<string, unknown>;
  const summary = result["summary"];
  if (typeof summary === "string" && summary.length > 0) {
    return summary;
  }
  return fallback;
};

/**
 *
 * @param simulation
 * @returns The computed value.
   */
const extractResultValue = (simulation: Simulation): number | null => {
  const result = simulation.result as Record<string, unknown>;
  const candidate = result["result_value"] ?? result["value"];
  return typeof candidate === "number" ? candidate : null;
};

/**
 * Maps a Simulation domain model to a SimulationCardDto for the listing UI.
 * @param simulation
 * @returns The computed value.
   */
export const mapToSimulationCardDto = (simulation: Simulation): SimulationCardDto => {
  const label = extractLabel(simulation);
  return {
    id: simulation.id,
    name: label,
    type: resolveType(simulation.toolId),
    created_at: simulation.createdAt,
    summary: extractSummary(simulation, label),
    result_value: extractResultValue(simulation),
  };
};
