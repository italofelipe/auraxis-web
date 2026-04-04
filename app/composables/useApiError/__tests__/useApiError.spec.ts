import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { useApiError } from "../useApiError";

// t() returns the key so we can assert on keys directly
vi.mock("vue-i18n", (): Record<string, unknown> => ({
  useI18n: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

/**
 * Builds a minimal ApiError-shaped object (as produced by useHttpClient).
 *
 * @param status - HTTP status code of the simulated error.
 * @param code - Optional machine-readable error code.
 * @returns Duck-typed ApiError object.
 */
const makeApiError = (status: number, code?: string): object => ({
  name: "ApiError",
  status,
  message: "some error",
  code,
});

describe("useApiError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns BRAPI unavailable key for BRAPI_API_KEY_NOT_CONFIGURED", () => {
    const { getErrorMessage } = useApiError();
    const error = new Error("BRAPI_API_KEY_NOT_CONFIGURED");
    expect(getErrorMessage(error)).toBe("wallet.form.unitPrice.brapiUnavailable");
  });

  it("maps ApiError with VALIDATION_ERROR code", () => {
    const { getErrorMessage } = useApiError();
    expect(getErrorMessage(makeApiError(422, "VALIDATION_ERROR"))).toBe(
      "errors.VALIDATION_ERROR",
    );
  });

  it("maps ApiError with MISSING_TOKEN code", () => {
    const { getErrorMessage } = useApiError();
    expect(getErrorMessage(makeApiError(401, "MISSING_TOKEN"))).toBe(
      "errors.MISSING_TOKEN",
    );
  });

  it("maps ApiError with UNAUTHORIZED code", () => {
    const { getErrorMessage } = useApiError();
    expect(getErrorMessage(makeApiError(403, "UNAUTHORIZED"))).toBe(
      "errors.UNAUTHORIZED",
    );
  });

  it("maps ApiError with NOT_FOUND code", () => {
    const { getErrorMessage } = useApiError();
    expect(getErrorMessage(makeApiError(404, "NOT_FOUND"))).toBe(
      "errors.NOT_FOUND",
    );
  });

  it("maps ApiError with fieldMayNotBeNull code", () => {
    const { getErrorMessage } = useApiError();
    expect(getErrorMessage(makeApiError(422, "fieldMayNotBeNull"))).toBe(
      "errors.fieldMayNotBeNull",
    );
  });

  it("maps ApiError with fieldRequired code", () => {
    const { getErrorMessage } = useApiError();
    expect(getErrorMessage(makeApiError(422, "fieldRequired"))).toBe(
      "errors.fieldRequired",
    );
  });

  it("maps ApiError with invalidEmail code", () => {
    const { getErrorMessage } = useApiError();
    expect(getErrorMessage(makeApiError(422, "invalidEmail"))).toBe(
      "errors.invalidEmail",
    );
  });

  it("maps ApiError with invalidDate code", () => {
    const { getErrorMessage } = useApiError();
    expect(getErrorMessage(makeApiError(422, "invalidDate"))).toBe(
      "errors.invalidDate",
    );
  });

  it("maps ApiError with SERVER_ERROR code", () => {
    const { getErrorMessage } = useApiError();
    expect(getErrorMessage(makeApiError(500, "SERVER_ERROR"))).toBe(
      "errors.SERVER_ERROR",
    );
  });

  it("maps ApiError 403 without code to UNAUTHORIZED key", () => {
    const { getErrorMessage } = useApiError();
    expect(getErrorMessage(makeApiError(403))).toBe("errors.UNAUTHORIZED");
  });

  it("maps ApiError 400 without code to UNKNOWN key", () => {
    const { getErrorMessage } = useApiError();
    expect(getErrorMessage(makeApiError(400))).toBe("errors.UNKNOWN");
  });

  it("maps ApiError 401 without code to UNAUTHORIZED key", () => {
    const { getErrorMessage } = useApiError();
    expect(getErrorMessage(makeApiError(401))).toBe("errors.UNAUTHORIZED");
  });

  it("maps ApiError 404 without code to NOT_FOUND key", () => {
    const { getErrorMessage } = useApiError();
    expect(getErrorMessage(makeApiError(404))).toBe("errors.NOT_FOUND");
  });

  it("maps ApiError 500 without code to SERVER_ERROR key", () => {
    const { getErrorMessage } = useApiError();
    expect(getErrorMessage(makeApiError(500))).toBe("errors.SERVER_ERROR");
  });

  it("maps ApiError 422 without code to VALIDATION_ERROR key", () => {
    const { getErrorMessage } = useApiError();
    expect(getErrorMessage(makeApiError(422))).toBe("errors.VALIDATION_ERROR");
  });

  it("maps network error (axios error with no response) to NETWORK_ERROR key", () => {
    const { getErrorMessage } = useApiError();
    const axiosError = new axios.AxiosError("Network Error");
    expect(getErrorMessage(axiosError)).toBe("errors.NETWORK_ERROR");
  });

  it("maps unknown thrown value to UNKNOWN key", () => {
    const { getErrorMessage } = useApiError();
    expect(getErrorMessage(new Error("something random"))).toBe("errors.UNKNOWN");
    expect(getErrorMessage("string error")).toBe("errors.UNKNOWN");
    expect(getErrorMessage(null)).toBe("errors.UNKNOWN");
  });

  it("maps axios error with 401 response to UNAUTHORIZED key", () => {
    const { getErrorMessage } = useApiError();
    const axiosError = new axios.AxiosError("Unauthorized");
    axiosError.response = { status: 401, data: {}, headers: {}, config: {} as never, statusText: "Unauthorized" };
    expect(getErrorMessage(axiosError)).toBe("errors.UNAUTHORIZED");
  });

  it("maps axios error with 404 response to NOT_FOUND key", () => {
    const { getErrorMessage } = useApiError();
    const axiosError = new axios.AxiosError("Not Found");
    axiosError.response = { status: 404, data: {}, headers: {}, config: {} as never, statusText: "Not Found" };
    expect(getErrorMessage(axiosError)).toBe("errors.NOT_FOUND");
  });

  it("maps axios error with 500 response to SERVER_ERROR key", () => {
    const { getErrorMessage } = useApiError();
    const axiosError = new axios.AxiosError("Internal Server Error");
    axiosError.response = { status: 500, data: {}, headers: {}, config: {} as never, statusText: "Internal Server Error" };
    expect(getErrorMessage(axiosError)).toBe("errors.SERVER_ERROR");
  });

  it("maps axios error with 422 response and code in data to mapped key", () => {
    const { getErrorMessage } = useApiError();
    const axiosError = new axios.AxiosError("Validation Error");
    axiosError.response = { status: 422, data: { code: "fieldRequired" }, headers: {}, config: {} as never, statusText: "Unprocessable Entity" };
    expect(getErrorMessage(axiosError)).toBe("errors.fieldRequired");
  });
});
