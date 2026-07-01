/**
 * DTOs for the "Ask Anything" AI financial chat endpoint (`POST /ai/chat`).
 *
 * Shapes mirror the auraxis-api contract shipped in PR #1521/#1522. The chat is
 * stateless and single-turn: each request carries one question and the response
 * carries the grounded answer plus usage metadata.
 */

/** Request body accepted by `POST /ai/chat`. */
export interface AIChatRequestDTO {
  /** Natural-language question about the user's own finances (1–1000 chars). */
  readonly question: string;
}

/**
 * Successful payload returned by `POST /ai/chat`, nested under the v2 envelope
 * `data` field.
 */
export interface AIChatResponseDTO {
  /** Snapshot-grounded answer produced by the LLM. */
  readonly answer: string;
  /** Identifier of the model that generated the answer (e.g. `gpt-4o-mini`). */
  readonly model: string;
  /** Total tokens consumed by the request. */
  readonly tokens_used: number;
  /** Estimated cost of the request in USD. */
  readonly cost_usd: number;
}

/**
 * Generic v2 response envelope used across the Auraxis API. Defined locally to
 * avoid a lateral import from another feature (each feature owns its contracts).
 */
export interface V2EnvelopeDTO<T> {
  readonly success?: boolean;
  readonly message?: string;
  readonly data?: T;
}
