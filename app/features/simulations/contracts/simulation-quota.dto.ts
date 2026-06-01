import type { SimulationQuota } from "~/features/simulations/model/simulation-quota";

/** Payload cru do backend (snake_case), tanto flat quanto sob `data`. */
export interface SimulationQuotaDto {
  readonly limit: number;
  readonly used: number;
  readonly remaining: number | null;
  readonly unlimited: boolean;
  readonly allowed: boolean;
  readonly reset_at: string;
}

interface SimulationQuotaEnvelopeDto {
  readonly success?: boolean;
  readonly message?: string;
  readonly data?: SimulationQuotaDto | null;
}

type SimulationQuotaResponseDto = SimulationQuotaDto | SimulationQuotaEnvelopeDto;

const EXHAUSTED_FALLBACK: SimulationQuota = {
  limit: 1,
  used: 0,
  remaining: null,
  unlimited: false,
  allowed: false,
  resetAt: "",
};

/**
 * Detecta o envelope v2 (`{ data }`) versus o payload flat legacy.
 *
 * @param payload Corpo da resposta de /simulations/quota.
 * @returns True quando o payload encapsula os dados em `data`.
 */
const isEnvelope = (
  payload: SimulationQuotaResponseDto,
): payload is SimulationQuotaEnvelopeDto => {
  return payload !== null && typeof payload === "object" && "data" in payload;
};

/**
 * Normaliza a resposta (flat legacy ou envelope `data`) para o domínio.
 *
 * @param payload Corpo da resposta de /simulations/quota.
 * @returns View-model de domínio tipado.
 */
export const toSimulationQuota = (
  payload: SimulationQuotaResponseDto,
): SimulationQuota => {
  const dto = isEnvelope(payload) ? (payload.data ?? null) : payload;
  if (dto === null) {
    return EXHAUSTED_FALLBACK;
  }
  return {
    limit: dto.limit,
    used: dto.used,
    remaining: dto.remaining,
    unlimited: dto.unlimited,
    allowed: dto.allowed,
    resetAt: dto.reset_at,
  };
};
