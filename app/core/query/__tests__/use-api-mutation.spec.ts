import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "~/core/errors";

import { createApiMutation } from "../use-api-mutation";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const useMutationMock = vi.hoisted(() => vi.fn());
const useQueryClientMock = vi.hoisted(() => vi.fn());
const useMessageMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useMutation: useMutationMock,
  useQueryClient: useQueryClientMock,
}));

vi.mock("naive-ui", () => ({
  useMessage: useMessageMock,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Shared message spy injected into every test. */
let messageSuccessSpy: ReturnType<typeof vi.fn>;

/** Shared invalidateQueries spy injected into every test. */
let invalidateQueriesSpy: ReturnType<typeof vi.fn>;

/**
 * Extracts the onSuccess handler registered with useMutation.
 *
 * @returns The onSuccess callback or undefined.
 */
const getOnSuccess = (): ((data: unknown, variables: unknown) => void) | undefined => {
  const call = useMutationMock.mock.calls[0];
  return (call?.[0] as { onSuccess?: (d: unknown, v: unknown) => void } | undefined)?.onSuccess;
};

/**
 * Extracts the onError handler registered with useMutation.
 *
 * @returns The onError callback or undefined.
 */
const getOnError = (): ((error: ApiError) => void) | undefined => {
  const call = useMutationMock.mock.calls[0];
  return (call?.[0] as { onError?: (e: ApiError) => void } | undefined)?.onError;
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createApiMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    messageSuccessSpy = vi.fn();
    invalidateQueriesSpy = vi.fn();

    useMessageMock.mockReturnValue({ success: messageSuccessSpy });
    useQueryClientMock.mockReturnValue({ invalidateQueries: invalidateQueriesSpy });
    useMutationMock.mockImplementation((opts: Record<string, unknown>) => opts);
  });

  it("chama useMutation com a mutationFn fornecida", () => {
    const mutationFn = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    createApiMutation(mutationFn);

    expect(useMutationMock).toHaveBeenCalledOnce();
    const registeredFn = (useMutationMock.mock.calls[0]?.[0] as { mutationFn: typeof mutationFn }).mutationFn;
    expect(registeredFn).toBe(mutationFn);
  });

  it("exibe toast de sucesso quando successMessage é fornecido", () => {
    createApiMutation(vi.fn<() => Promise<string>>().mockResolvedValue("ok"), {
      successMessage: "Operação concluída!",
    });

    const onSuccess = getOnSuccess();
    onSuccess?.("ok", undefined);

    expect(messageSuccessSpy).toHaveBeenCalledOnce();
    expect(messageSuccessSpy).toHaveBeenCalledWith("Operação concluída!", {
      duration: 4_000,
    });
  });

  it("não exibe toast de sucesso quando successMessage é omitido", () => {
    createApiMutation(vi.fn<() => Promise<void>>().mockResolvedValue(undefined));

    const onSuccess = getOnSuccess();
    onSuccess?.(undefined, undefined);

    expect(messageSuccessSpy).not.toHaveBeenCalled();
  });

  it("invalida queries listadas em invalidates após sucesso", () => {
    createApiMutation(vi.fn<() => Promise<void>>().mockResolvedValue(undefined), {
      invalidates: [["alerts", "list"], ["alerts", "unread"]],
    });

    const onSuccess = getOnSuccess();
    onSuccess?.(undefined, undefined);

    expect(invalidateQueriesSpy).toHaveBeenCalledTimes(2);
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["alerts", "list"],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["alerts", "unread"],
    });
  });

  it("não invalida queries quando invalidates é omitido", () => {
    createApiMutation(vi.fn<() => Promise<void>>().mockResolvedValue(undefined), {
      successMessage: "Ok",
    });

    const onSuccess = getOnSuccess();
    onSuccess?.(undefined, undefined);

    expect(invalidateQueriesSpy).not.toHaveBeenCalled();
  });

  it("chama onSuccess callback após toast e invalidação", () => {
    const onSuccessCallback = vi.fn<(data: string, variables: undefined) => void>();
    createApiMutation(vi.fn<() => Promise<string>>().mockResolvedValue("done"), {
      successMessage: "Pronto",
      invalidates: [["goals"]],
      onSuccess: onSuccessCallback,
    });

    const onSuccess = getOnSuccess();
    onSuccess?.("done", undefined);

    expect(messageSuccessSpy).toHaveBeenCalledBefore(onSuccessCallback);
    expect(invalidateQueriesSpy).toHaveBeenCalledBefore(onSuccessCallback);
    expect(onSuccessCallback).toHaveBeenCalledWith("done", undefined);
  });

  it("chama onError callback quando a mutation falha", () => {
    const onErrorCallback = vi.fn<(error: ApiError) => void>();
    createApiMutation(vi.fn<() => Promise<void>>().mockResolvedValue(undefined), {
      onError: onErrorCallback,
    });

    const onError = getOnError();
    const apiError = new ApiError(409, "Conflict");
    onError?.(apiError);

    expect(onErrorCallback).toHaveBeenCalledOnce();
    expect(onErrorCallback).toHaveBeenCalledWith(apiError);
  });

  it("não lança erro quando onError é omitido e a mutation falha", () => {
    createApiMutation(vi.fn<() => Promise<undefined>>().mockResolvedValue(undefined));

    const onError = getOnError();
    const apiError = new ApiError(500, "Server error");

    expect(() => onError?.(apiError)).not.toThrow();
  });

  it("funciona sem nenhuma option fornecida", () => {
    const mutationFn = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    createApiMutation(mutationFn);

    const onSuccess = getOnSuccess();
    expect(() => onSuccess?.(undefined, undefined)).not.toThrow();
    expect(messageSuccessSpy).not.toHaveBeenCalled();
    expect(invalidateQueriesSpy).not.toHaveBeenCalled();
  });

  it("invoca useMutation, useQueryClient e useMessage exatamente uma vez", () => {
    createApiMutation(vi.fn<() => Promise<void>>().mockResolvedValue(undefined));

    expect(useMutationMock).toHaveBeenCalledOnce();
    expect(useQueryClientMock).toHaveBeenCalledOnce();
    expect(useMessageMock).toHaveBeenCalledOnce();
  });
});
