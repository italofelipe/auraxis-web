import { setActivePinia, createPinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import {
  type EmailVerificationGatePayload,
  useEmailVerificationGate,
} from "./use-email-verification-gate";

describe("useEmailVerificationGate", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const samplePayload: EmailVerificationGatePayload = {
    message: "Confirme seu email",
    deadlinePassedAt: "2026-05-20T10:00:00Z",
    resendEndpoint: "/auth/email/resend",
  };

  it("starts closed with no payload", () => {
    const gate = useEmailVerificationGate();
    expect(gate.isOpen).toBe(false);
    expect(gate.payload).toBeNull();
  });

  it("open(payload) flips isOpen and stores the payload", () => {
    const gate = useEmailVerificationGate();
    gate.open(samplePayload);
    expect(gate.isOpen).toBe(true);
    expect(gate.payload).toEqual(samplePayload);
  });

  it("close() resets isOpen and payload", () => {
    const gate = useEmailVerificationGate();
    gate.open(samplePayload);
    gate.close();
    expect(gate.isOpen).toBe(false);
    expect(gate.payload).toBeNull();
  });

  it("open() can be called multiple times with new payloads", () => {
    const gate = useEmailVerificationGate();
    gate.open(samplePayload);
    const second: EmailVerificationGatePayload = {
      message: "Outro motivo",
      deadlinePassedAt: null,
      resendEndpoint: "/auth/email/resend",
    };
    gate.open(second);
    expect(gate.payload).toEqual(second);
    expect(gate.isOpen).toBe(true);
  });
});
