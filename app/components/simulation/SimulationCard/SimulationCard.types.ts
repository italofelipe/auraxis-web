import type { SimulationCardDto, SimulationType } from "~/features/simulations/contracts/simulation-card.dto";

export type SimulationCardProps = {
  simulation: SimulationCardDto;
  loading?: boolean;
};

export type SimulationCardEmits = {
  /** Emitted when the user requests deletion of the simulation. */
  (event: "delete", id: string): void;
};

export type { SimulationType };
