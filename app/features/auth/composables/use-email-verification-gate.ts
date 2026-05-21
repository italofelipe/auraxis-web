/**
 * Global state for the email verification gate modal.
 *
 * Opens automatically when the HTTP interceptor catches a 403 response with
 * body `{ error: "EMAIL_VERIFICATION_REQUIRED", ... }`. The single modal
 * mounted in the default layout subscribes to this state.
 *
 * Closes when the user confirms verification (refresh succeeds) or
 * explicitly dismisses.
 */

import { defineStore } from "pinia";

/**
 * Payload emitted by the backend when the 14-day grace period expires
 * without email confirmation. Mirrors the canonical body of a 403
 * `EMAIL_VERIFICATION_REQUIRED` response.
 */
export interface EmailVerificationGatePayload {
  readonly message: string;
  readonly deadlinePassedAt: string | null;
  readonly resendEndpoint: string;
}

interface GateState {
  isOpen: boolean;
  payload: EmailVerificationGatePayload | null;
}

export const useEmailVerificationGate = defineStore("emailVerificationGate", {
  state: (): GateState => ({
    isOpen: false,
    payload: null,
  }),
  actions: {
    open(payload: EmailVerificationGatePayload): void {
      this.isOpen = true;
      this.payload = payload;
    },
    close(): void {
      this.isOpen = false;
      this.payload = null;
    },
  },
});
