import { useHttp } from "~/composables/useHttp/useHttp";

/**
 * Persists onboarding completion on the server (idempotent).
 *
 * Mirrors `POST /user/onboarding/complete`. Called when the user finishes or
 * skips the wizard so the decision is stored against the account and survives
 * clearing browser storage on any device (#1033).
 *
 * @returns Resolves once the server has recorded completion.
 */
export async function postOnboardingComplete(): Promise<void> {
  const http = useHttp();
  await http.post("/user/onboarding/complete");
}
