import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUpdateWalletEntryMutation, type UpdateWalletEntryInput } from "./use-update-wallet-entry-mutation";
import type { CreateWalletEntryPayload } from "~/features/wallet/services/wallet.client";
import type { WalletEntryDto } from "~/features/portfolio/contracts/portfolio.dto";

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

/**
 * Builds a minimal WalletEntryDto fixture for testing.
 *
 * @returns WalletEntryDto fixture.
 */
const makeEntry = (): WalletEntryDto => ({
  id: "entry-1",
  name: "Petrobras",
  ticker: "PETR4",
  asset_type: "stock",
  quantity: 100,
  cost_basis: 3850,
  register_date: "2026-01-01",
  current_value: null,
  current_price: null,
  profit_loss: null,
  profit_loss_percent: null,
  should_be_on_wallet: true,
});

/**
 * Builds a minimal UpdateWalletEntryInput fixture for testing.
 *
 * @returns UpdateWalletEntryInput fixture.
 */
const makeInput = (): UpdateWalletEntryInput => ({
  id: "entry-1",
  payload: {
    name: "Petrobras Updated",
    quantity: 150,
    register_date: "2026-01-01",
    should_be_on_wallet: true,
  } as Partial<CreateWalletEntryPayload>,
});

describe("useUpdateWalletEntryMutation", () => {
  beforeEach((): void => {
    vi.clearAllMocks();
    useQueryClientMock.mockReturnValue({ invalidateQueries: vi.fn() });
    useMessageMock.mockReturnValue({ success: vi.fn(), error: vi.fn() });
    useMutationMock.mockImplementation((opts: unknown) => opts);
  });

  it("registers the mutation with useMutation from @tanstack/vue-query", (): void => {
    const client = { updateEntry: vi.fn().mockResolvedValue(makeEntry()) };

    useUpdateWalletEntryMutation(client as never);

    expect(useMutationMock).toHaveBeenCalledOnce();
  });

  it("mutationFn calls client.updateEntry with the correct id and payload", async (): Promise<void> => {
    const updatedEntry = makeEntry();
    const client = { updateEntry: vi.fn().mockResolvedValue(updatedEntry) };
    useMutationMock.mockImplementation(
      (opts: { mutationFn: (input: UpdateWalletEntryInput) => Promise<WalletEntryDto> }) => opts,
    );

    const mutation = useUpdateWalletEntryMutation(client as never) as unknown as {
      mutationFn: (input: UpdateWalletEntryInput) => Promise<WalletEntryDto>;
    };

    const input = makeInput();
    const result = await mutation.mutationFn(input);

    expect(client.updateEntry).toHaveBeenCalledWith(input.id, input.payload);
    expect(result).toEqual(updatedEntry);
  });

  it("invalidates both wallet entries and portfolio summary on success", (): void => {
    const client = { updateEntry: vi.fn().mockResolvedValue(makeEntry()) };
    const queryClient = { invalidateQueries: vi.fn() };
    useQueryClientMock.mockReturnValue(queryClient);
    useMutationMock.mockImplementation(
      (opts: { onSuccess: (data: WalletEntryDto, vars: UpdateWalletEntryInput) => void }) => opts,
    );

    const mutation = useUpdateWalletEntryMutation(client as never) as unknown as {
      onSuccess: (data: WalletEntryDto, vars: UpdateWalletEntryInput) => void;
    };

    mutation.onSuccess(makeEntry(), makeInput());

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["wallet", "entries"],
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["wallet", "summary"],
    });
  });

  it("propagates errors from client.updateEntry without catching them", async (): Promise<void> => {
    const client = {
      updateEntry: vi.fn().mockRejectedValue(new Error("PATCH failed")),
    };
    useMutationMock.mockImplementation(
      (opts: { mutationFn: (input: UpdateWalletEntryInput) => Promise<WalletEntryDto> }) => opts,
    );

    const mutation = useUpdateWalletEntryMutation(client as never) as unknown as {
      mutationFn: (input: UpdateWalletEntryInput) => Promise<WalletEntryDto>;
    };

    await expect(mutation.mutationFn(makeInput())).rejects.toThrow("PATCH failed");
  });

  it("shows a success toast message after a successful update", (): void => {
    const client = { updateEntry: vi.fn().mockResolvedValue(makeEntry()) };
    const messageInstance = { success: vi.fn(), error: vi.fn() };
    useMessageMock.mockReturnValue(messageInstance);
    useMutationMock.mockImplementation(
      (opts: { onSuccess: (data: WalletEntryDto, vars: UpdateWalletEntryInput) => void }) => opts,
    );

    const mutation = useUpdateWalletEntryMutation(client as never) as unknown as {
      onSuccess: (data: WalletEntryDto, vars: UpdateWalletEntryInput) => void;
    };

    mutation.onSuccess(makeEntry(), makeInput());

    expect(messageInstance.success).toHaveBeenCalledOnce();
    expect(messageInstance.success).toHaveBeenCalledWith(
      "Ativo atualizado com sucesso.",
      expect.objectContaining({ duration: expect.any(Number) }),
    );
  });
});
