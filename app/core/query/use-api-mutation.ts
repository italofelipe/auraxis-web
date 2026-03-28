/**
 * Generic mutation factory for the Auraxis API.
 *
 * Wraps `useMutation` from TanStack Vue Query with:
 * - Typed `ApiError` propagation so consumers get a fully typed error channel.
 * - Optional success toast via NaiveUI `useMessage`.
 * - Optional query-cache invalidation after successful mutation.
 * - Optional `onSuccess` / `onError` callbacks for feature-level side effects.
 *
 * Error toasting for 403/5xx is already handled globally by the Axios response
 * interceptor (`registerResponseInterceptors`). `createApiMutation` intentionally
 * does NOT add an automatic error toast to avoid double-notification.
 *
 * Must be called from within a Vue component `setup` context.
 */

import {
  type QueryKey,
  type UseMutationReturnType,
  useMutation,
  useQueryClient,
} from "@tanstack/vue-query";
import { useMessage } from "naive-ui";

import type { ApiError } from "~/core/errors";

/** Duration in milliseconds for success toast messages. */
const SUCCESS_TOAST_DURATION_MS = 4_000;

/**
 * Options accepted by {@link createApiMutation}.
 *
 * @template TData Shape of the resolved data on success.
 * @template TVariables Shape of the mutation input variables.
 */
export interface ApiMutationOptions<TData, TVariables> {
  /**
   * Human-readable success message displayed as a toast after the mutation
   * resolves. Omit to suppress the automatic success notification.
   */
  readonly successMessage?: string;

  /**
   * List of query keys to invalidate after the mutation resolves.
   * Each entry is passed to `queryClient.invalidateQueries({ queryKey })`.
   *
   * @example
   * ```ts
   * invalidates: [["alerts", "list"]]
   * ```
   */
  readonly invalidates?: QueryKey[];

  /**
   * Optional callback invoked after the mutation resolves and built-in
   * side effects (toast, invalidation) have run.
   *
   * @param data Resolved mutation data.
   * @param variables Variables passed to the mutation.
   */
  readonly onSuccess?: (data: TData, variables: TVariables) => void;

  /**
   * Optional callback invoked when the mutation rejects.
   * The generic 403/5xx cases are already handled by the HTTP interceptor;
   * use this for domain-specific error handling (e.g., 409 conflict).
   *
   * @param error Typed ApiError from the Axios interceptor.
   */
  readonly onError?: (error: ApiError) => void;
}

/**
 * Creates a type-safe TanStack Vue Query mutation with built-in side effects.
 *
 * @template TData Shape of the resolved data on success.
 * @template TVariables Shape of the mutation input variables. Defaults to `void`
 *   for mutations that take no arguments.
 * @param mutationFn Async function that performs the mutation.
 * @param options Optional side effects: success toast, cache invalidation,
 *   and custom callbacks.
 * @returns Reactive Vue Query mutation state: `mutate`, `isPending`, `isError`, etc.
 *
 * @example
 * ```ts
 * export const useDeleteAlertMutation = () =>
 *   createApiMutation(
 *     (id: string) => alertsApi.deleteAlert(id),
 *     {
 *       successMessage: "Alerta removido com sucesso.",
 *       invalidates: [["alerts", "list"]],
 *     },
 *   );
 * ```
 */
export const createApiMutation = <TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: ApiMutationOptions<TData, TVariables>,
): UseMutationReturnType<TData, ApiError, TVariables, unknown> => {
  const queryClient = useQueryClient();
  const message = useMessage();

  return useMutation<TData, ApiError, TVariables>({
    mutationFn,

    onSuccess: (data: TData, variables: TVariables): void => {
      if (options?.successMessage) {
        message.success(options.successMessage, {
          duration: SUCCESS_TOAST_DURATION_MS,
        });
      }

      if (options?.invalidates) {
        for (const queryKey of options.invalidates) {
          queryClient.invalidateQueries({ queryKey });
        }
      }

      options?.onSuccess?.(data, variables);
    },

    onError: (error: ApiError): void => {
      options?.onError?.(error);
    },
  });
};
