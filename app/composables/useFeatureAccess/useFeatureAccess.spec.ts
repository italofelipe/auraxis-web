import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useFeatureAccess } from "./useFeatureAccess";

const useEntitlementQueryMock = vi.hoisted(() => vi.fn());

vi.mock("~/features/paywall/queries/use-entitlement-query", () => ({
  useEntitlementQuery: useEntitlementQueryMock,
}));

describe("useFeatureAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns hasAccess=true when query data is true", () => {
    useEntitlementQueryMock.mockReturnValue({
      data: ref(true),
      isLoading: ref(false),
      isError: ref(false),
    });

    const { hasAccess, isLoading, isError } = useFeatureAccess("advanced_simulations");

    expect(hasAccess.value).toBe(true);
    expect(isLoading.value).toBe(false);
    expect(isError.value).toBe(false);
  });

  it("returns hasAccess=false when query data is false", () => {
    useEntitlementQueryMock.mockReturnValue({
      data: ref(false),
      isLoading: ref(false),
      isError: ref(false),
    });

    const { hasAccess } = useFeatureAccess("export_pdf");

    expect(hasAccess.value).toBe(false);
  });

  it("returns hasAccess=false when query data is undefined", () => {
    useEntitlementQueryMock.mockReturnValue({
      data: ref(undefined),
      isLoading: ref(false),
      isError: ref(false),
    });

    const { hasAccess } = useFeatureAccess("shared_entries");

    expect(hasAccess.value).toBe(false);
  });

  it("returns isLoading=true while query is loading", () => {
    useEntitlementQueryMock.mockReturnValue({
      data: ref(undefined),
      isLoading: ref(true),
      isError: ref(false),
    });

    const { isLoading, hasAccess } = useFeatureAccess("wallet_read");

    expect(isLoading.value).toBe(true);
    expect(hasAccess.value).toBe(false);
  });

  it("returns isError=true when query encounters an error", () => {
    useEntitlementQueryMock.mockReturnValue({
      data: ref(undefined),
      isLoading: ref(false),
      isError: ref(true),
    });

    const { isError, hasAccess } = useFeatureAccess("basic_simulations");

    expect(isError.value).toBe(true);
    expect(hasAccess.value).toBe(false);
  });

  it("delegates the feature key to useEntitlementQuery", () => {
    useEntitlementQueryMock.mockReturnValue({
      data: ref(true),
      isLoading: ref(false),
      isError: ref(false),
    });

    useFeatureAccess("advanced_simulations");

    expect(useEntitlementQueryMock).toHaveBeenCalledWith("advanced_simulations");
  });
});
