/**
 * Domain view-model da quota freemium do simulador de metas (#566).
 *
 * Espelha o contrato do backend (#1409): free tier consome 1 simulação/mês,
 * premium é ilimitado. `allowed` indica se a próxima simulação pode revelar o
 * resultado completo; quando `false`, a UI exibe o paywall.
 */
export interface SimulationQuota {
  readonly limit: number;
  readonly used: number;
  /** `null` quando ilimitado (premium). */
  readonly remaining: number | null;
  readonly unlimited: boolean;
  readonly allowed: boolean;
  /** ISO UTC do próximo reset (1º dia do próximo mês). */
  readonly resetAt: string;
}

/** Snapshot otimista usado como fallback/inicial enquanto a query carrega. */
export const UNKNOWN_SIMULATION_QUOTA: SimulationQuota = {
  limit: 1,
  used: 0,
  remaining: 1,
  unlimited: false,
  allowed: true,
  resetAt: "",
};
