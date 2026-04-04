import axios from "axios";
import { useI18n } from "vue-i18n";
import type { UseApiErrorReturn } from "./useApiError.types";

/** Known API error code → i18n key suffix mapping. */
const ERROR_CODE_MAP: Record<string, string> = {
  VALIDATION_ERROR: "errors.VALIDATION_ERROR",
  MISSING_TOKEN: "errors.MISSING_TOKEN",
  UNAUTHORIZED: "errors.UNAUTHORIZED",
  NOT_FOUND: "errors.NOT_FOUND",
  SERVER_ERROR: "errors.SERVER_ERROR",
  NETWORK_ERROR: "errors.NETWORK_ERROR",
  fieldMayNotBeNull: "errors.fieldMayNotBeNull",
  fieldRequired: "errors.fieldRequired",
  invalidEmail: "errors.invalidEmail",
  invalidDate: "errors.invalidDate",
};

/**
 * Maps an HTTP status code to an i18n key when no error `code` field is present.
 *
 * @param status - HTTP status code from the response.
 * @returns i18n translation key for the given status.
 */
const statusToI18nKey = (status: number): string => {
  if (status === 401 || status === 403) { return "errors.UNAUTHORIZED"; }
  if (status === 404) { return "errors.NOT_FOUND"; }
  if (status >= 500) { return "errors.SERVER_ERROR"; }
  if (status === 422) { return "errors.VALIDATION_ERROR"; }
  return "errors.UNKNOWN";
};

/**
 * Returns true when the given value looks like an ApiError (duck-typed).
 *
 * @param error - Unknown thrown value to check.
 * @returns True when the value is a duck-typed ApiError.
 */
const isApiErrorShape = (
  error: unknown,
): error is { name: string; status: number; message: string; code?: string } =>
  error !== null &&
  typeof error === "object" &&
  "name" in error &&
  (error as { name: string }).name === "ApiError";

/**
 * Resolves the i18n key for a duck-typed ApiError.
 *
 * @param apiErr - Duck-typed ApiError with status and optional code.
 * @param apiErr.status - HTTP status code.
 * @param apiErr.code - Optional machine-readable error code.
 * @returns i18n translation key.
 */
const resolveApiErrorKey = (apiErr: {
  status: number;
  code?: string;
}): string => {
  const mappedCode = apiErr.code ? ERROR_CODE_MAP[apiErr.code] : undefined;
  if (mappedCode) {
    return mappedCode;
  }
  return statusToI18nKey(apiErr.status);
};

/**
 * Resolves the i18n key for an Axios error.
 *
 * @param error - AxiosError thrown during an HTTP request.
 * @returns i18n translation key.
 */
const resolveAxiosErrorKey = (error: unknown): string => {
  if (!axios.isAxiosError(error)) { return "errors.UNKNOWN"; }

  const status = error.response?.status ?? 0;
  const code = (error.response?.data as { code?: string } | undefined)?.code;

  const mappedCode = code ? ERROR_CODE_MAP[code] : undefined;
  if (mappedCode) {
    return mappedCode;
  }

  if (!error.response) {
    return "errors.NETWORK_ERROR";
  }

  return statusToI18nKey(status);
};

/**
 * Composable that translates raw API errors into user-friendly localised messages.
 *
 * Centralises error message logic so that all feature-level error displays
 * consistently map API error codes to i18n keys instead of showing raw
 * English messages from the backend.
 *
 * Must be called inside a Vue `setup` context so `useI18n` is available.
 *
 * @returns Object with `getErrorMessage` helper.
 *
 * @example
 * ```ts
 * const { getErrorMessage } = useApiError();
 *
 * try { await mutateAsync(payload); }
 * catch (err) { toast.error(getErrorMessage(err)); }
 * ```
 */
export function useApiError(): UseApiErrorReturn {
  const { t } = useI18n();

  /**
   * Maps an unknown thrown value to a user-friendly localised error message.
   *
   * @param error - Unknown thrown value (ApiError, AxiosError, Error, or any).
   * @returns Localised error message string.
   */
  function getErrorMessage(error: unknown): string {
    // BRAPI key missing — specific internal guard error
    if (error instanceof Error && error.message === "BRAPI_API_KEY_NOT_CONFIGURED") {
      return t("wallet.form.unitPrice.brapiUnavailable");
    }

    if (isApiErrorShape(error)) {
      return t(resolveApiErrorKey(error));
    }

    if (axios.isAxiosError(error)) {
      return t(resolveAxiosErrorKey(error));
    }

    return t("errors.UNKNOWN");
  }

  return { getErrorMessage };
}
