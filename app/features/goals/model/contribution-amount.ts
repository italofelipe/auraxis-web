/** Direction of a goal contribution. */
export type ContributionDirection = "deposit" | "withdrawal";

/**
 * Computes the signed amount for a contribution from a magnitude and direction.
 *
 * The UI captures a positive magnitude plus a direction toggle (Entrada /
 * Saída). Deposits stay positive; withdrawals are negated. Returns null when
 * the magnitude is missing or not a positive finite number, so callers can
 * block submission of an empty or zero amount.
 *
 * @param magnitude Positive amount typed by the user, or null when empty.
 * @param direction Selected toggle: deposit (+) or withdrawal (−).
 * @returns Signed amount, or null when the magnitude is invalid.
 */
export const computeSignedAmount = (
  magnitude: number | null,
  direction: ContributionDirection,
): number | null => {
  if (magnitude === null || !Number.isFinite(magnitude) || magnitude <= 0) {
    return null;
  }

  return direction === "withdrawal" ? -magnitude : magnitude;
};
