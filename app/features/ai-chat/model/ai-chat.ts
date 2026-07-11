/**
 * Domain (view-model) types for the AI financial chat feature.
 *
 * These are the shapes consumed by the composable and components — decoupled
 * from the raw API DTOs in `contracts/ai-chat.ts`.
 */

/** Who authored a chat message. */
export type ChatMessageRole = "user" | "assistant";

/** A single message rendered in the chat transcript. */
export interface ChatMessage {
  /** Stable client-generated identifier (used as the list key). */
  readonly id: string;
  /** Author of the message. */
  readonly role: ChatMessageRole;
  /** Rendered text content. */
  readonly content: string;
  /** ISO-8601 timestamp of when the message was appended. */
  readonly createdAt: string;
  /**
   * Period the answer context was anchored on (assistant messages, #1548) —
   * e.g. "julho/2026" when the question referenced a month.
   */
  readonly periodLabel?: string;
}

/**
 * Classified failure of a chat request, mapped from the backend error contract.
 *
 * - `entitlement` — caller is not Premium (403 `ENTITLEMENT_REQUIRED`).
 * - `consent` — AI consent not granted (403 `AI_CONSENT_REQUIRED`).
 * - `budget` — daily quota / cost budget exhausted (429 `AI_INSIGHT_BUDGET_EXCEEDED`).
 * - `validation` — invalid question (400 `VALIDATION_ERROR`).
 * - `server` — provider/internal failure or any unclassified error (500+).
 */
export type ChatErrorKind = "entitlement" | "consent" | "budget" | "validation" | "server";
