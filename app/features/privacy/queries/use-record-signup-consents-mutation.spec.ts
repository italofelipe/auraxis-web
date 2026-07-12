import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  PRIVACY_POLICY_VERSION,
  TERMS_OF_USE_VERSION,
} from "~/features/legal/legal-documents";
import type { PrivacyCenterClient } from "~/features/privacy/services/privacy-center.client";
import { useRecordSignupConsentsMutation } from "./use-record-signup-consents-mutation";

const createApiMutationMock = vi.hoisted(() => vi.fn());

vi.mock("~/core/query/use-api-mutation", () => ({
  createApiMutation: createApiMutationMock,
}));

describe("useRecordSignupConsentsMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createApiMutationMock.mockImplementation((fn: () => Promise<void>) => ({
      mutationFn: fn,
    }));
  });

  it("records terms and privacy grants with the current document versions", async () => {
    const recordConsent = vi.fn().mockResolvedValue(undefined);
    const client = { recordConsent } as unknown as PrivacyCenterClient;

    const mutation = useRecordSignupConsentsMutation(client) as unknown as {
      mutationFn: () => Promise<void>;
    };
    await mutation.mutationFn();

    expect(recordConsent).toHaveBeenCalledTimes(2);
    expect(recordConsent).toHaveBeenCalledWith({
      kind: "terms",
      version: TERMS_OF_USE_VERSION,
    });
    expect(recordConsent).toHaveBeenCalledWith({
      kind: "privacy",
      version: PRIVACY_POLICY_VERSION,
    });
  });
});
