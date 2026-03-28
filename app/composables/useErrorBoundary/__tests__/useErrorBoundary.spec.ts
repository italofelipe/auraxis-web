import { describe, it, expect, vi, beforeEach } from "vitest";
import { captureException } from "~/core/observability";
import { useErrorBoundary } from "../useErrorBoundary";

vi.mock("~/core/observability", () => ({
  captureException: vi.fn(),
}));

describe("useErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initialises with no error", () => {
    const { error, hasError } = useErrorBoundary();
    expect(error.value).toBeNull();
    expect(hasError.value).toBe(false);
  });

  describe("capture", () => {
    it("stores an Error instance directly", () => {
      const { error, capture } = useErrorBoundary();
      const err = new Error("something went wrong");
      capture(err);
      expect(error.value).toBe(err);
    });

    it("normalises a string to an Error", () => {
      const { error, capture } = useErrorBoundary();
      capture("network timeout");
      expect(error.value).toBeInstanceOf(Error);
      expect(error.value?.message).toBe("network timeout");
    });

    it("normalises a non-Error object to an Error", () => {
      const { error, capture } = useErrorBoundary();
      capture({ code: 500 });
      expect(error.value).toBeInstanceOf(Error);
    });

    it("sets hasError to true after capture", () => {
      const { hasError, capture } = useErrorBoundary();
      capture(new Error("oops"));
      expect(hasError.value).toBe(true);
    });

    it("calls captureException with the normalised error", () => {
      const { capture } = useErrorBoundary();
      const err = new Error("boom");
      capture(err);
      expect(captureException).toHaveBeenCalledWith(err);
    });

    it("calls captureException with a new Error when string is captured", () => {
      const { capture } = useErrorBoundary();
      capture("plain string error");
      expect(captureException).toHaveBeenCalledOnce();
      expect(captureException).toHaveBeenCalledWith(
        expect.objectContaining({ message: "plain string error" }),
      );
    });
  });

  describe("reset", () => {
    it("clears the error", () => {
      const { error, hasError, capture, reset } = useErrorBoundary();
      capture(new Error("oops"));
      reset();
      expect(error.value).toBeNull();
      expect(hasError.value).toBe(false);
    });
  });
});
