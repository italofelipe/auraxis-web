/**
 * Pure mapping from an unknown thrown value to a {@link ChatErrorKind}.
 *
 * The HTTP layer throws a typed `ApiError` carrying `status` and the backend
 * `error_code` (see `app/core/api/interceptors.ts`). We classify defensively via
 * duck-typing so the mapping also holds for plain error-like objects in tests.
 */

import type { ChatErrorKind } from "~/features/ai-chat/model/ai-chat";

/** Minimal error shape we can classify against. */
interface ErrorLike {
  readonly status?: number;
  readonly code?: string;
}

/**
 * Narrows an unknown thrown value to the fields relevant for classification.
 *
 * @param error Unknown thrown value.
 * @returns The status/code fields when present, else an empty object.
 */
const asErrorLike = (error: unknown): ErrorLike => {
  if (error !== null && typeof error === "object") {
    const candidate = error as { status?: unknown; code?: unknown };
    return {
      status: typeof candidate.status === "number" ? candidate.status : undefined,
      code: typeof candidate.code === "string" ? candidate.code : undefined,
    };
  }
  return {};
};

/**
 * Classifies a chat request failure into a stable, translatable error kind.
 *
 * @param error Unknown thrown value from the ask mutation.
 * @returns The classified {@link ChatErrorKind}.
 */
export const classifyChatError = (error: unknown): ChatErrorKind => {
  const { status, code } = asErrorLike(error);

  if (code === "ENTITLEMENT_REQUIRED") {
    return "entitlement";
  }
  if (code === "AI_CONSENT_REQUIRED") {
    return "consent";
  }
  if (code === "AI_INSIGHT_BUDGET_EXCEEDED" || status === 429) {
    return "budget";
  }
  if (status === 400) {
    return "validation";
  }
  // A 403 without a recognized code is still a gate — treat as entitlement.
  if (status === 403) {
    return "entitlement";
  }
  return "server";
};
