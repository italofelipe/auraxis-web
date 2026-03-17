/**
 * Core error types.
 *
 * Canonical location for infrastructure-level error classes.
 * The implementation lives in `~/utils/apiError.ts` (legacy path)
 * while incremental migration to feature-based structure is in progress.
 */
export { ApiError } from "~/utils/apiError";

/**
 * Returns true when the unknown thrown value is an ApiError with the given status.
 *
 * @param error Unknown thrown value.
 * @param status HTTP status code to match.
 * @returns True when error is an ApiError matching the given status.
 */
export const isApiErrorWithStatus = (error: unknown, status: number): boolean => {
  if (
    error !== null &&
    typeof error === "object" &&
    "name" in error &&
    (error as { name: string }).name === "ApiError" &&
    "status" in error
  ) {
    return (error as { status: number }).status === status;
  }
  return false;
};
