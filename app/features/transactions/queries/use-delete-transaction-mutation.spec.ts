import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDeleteTransactionMutation } from "./use-delete-transaction-mutation";

// ── Hoisted mocks ──────────────────────────────────────────────────────────────

const { useMutationMock, useQueryClientMock, invalidateQueriesMock } = vi.hoisted(() => {
	const invalidateQueriesMock = vi.fn().mockResolvedValue(undefined);
	return {
		useMutationMock: vi.fn(),
		useQueryClientMock: vi.fn(() => ({ invalidateQueries: invalidateQueriesMock })),
		invalidateQueriesMock,
	};
});

vi.mock("@tanstack/vue-query", () => ({
	useMutation: useMutationMock,
	useQueryClient: useQueryClientMock,
}));

describe("useDeleteTransactionMutation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useMutationMock.mockImplementation((opts: unknown) => opts);
	});

	it("calls client.deleteTransaction with the given id", async () => {
		const client = { deleteTransaction: vi.fn().mockResolvedValue(undefined) };

		const mutation = useDeleteTransactionMutation(client as never) as unknown as {
			mutationFn: (id: string) => Promise<void>;
		};

		await mutation.mutationFn("txn-abc");

		expect(client.deleteTransaction).toHaveBeenCalledWith("txn-abc");
	});

	it("invalidates the transactions list cache on success", async () => {
		const client = { deleteTransaction: vi.fn().mockResolvedValue(undefined) };

		const mutation = useDeleteTransactionMutation(client as never) as unknown as {
			onSuccess: () => Promise<void>;
		};

		await mutation.onSuccess();

		expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["transactions", "list"] });
	});

	it("propagates errors from client.deleteTransaction without catching", async () => {
		const client = {
			deleteTransaction: vi.fn().mockRejectedValue(new Error("delete failed")),
		};

		const mutation = useDeleteTransactionMutation(client as never) as unknown as {
			mutationFn: (id: string) => Promise<void>;
		};

		await expect(mutation.mutationFn("txn-abc")).rejects.toThrow("delete failed");
	});

	it("resolves void on successful deletion", async () => {
		const client = { deleteTransaction: vi.fn().mockResolvedValue(undefined) };

		const mutation = useDeleteTransactionMutation(client as never) as unknown as {
			mutationFn: (id: string) => Promise<void>;
		};

		const result = await mutation.mutationFn("txn-abc");

		expect(result).toBeUndefined();
	});
});
