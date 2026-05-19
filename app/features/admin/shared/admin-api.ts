export interface V2EnvelopeDto<T> {
  readonly data?: T | null;
}

/**
 * Checks whether an unknown payload can be safely inspected as an object.
 *
 * @param value Candidate payload.
 * @returns True when value is a non-null record.
 */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object";

/**
 * Unwraps standard API v2 envelopes while preserving support for flat mocks.
 *
 * @param payload Raw response body.
 * @returns Response data payload.
 */
export const unwrapData = <T>(payload: T | V2EnvelopeDto<T>): T => {
  if (isRecord(payload) && "data" in payload && payload.data !== undefined && payload.data !== null) {
    return payload.data as T;
  }

  return payload as T;
};

/**
 * Parses a date-time string into a stable display fallback.
 *
 * @param value ISO date-time or null.
 * @returns Original value when present; otherwise null.
 */
export const normalizeDateTime = (value: string | null | undefined): string | null =>
  value ?? null;
