import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMarkTransactionPaidMutation } from "./use-mark-transaction-paid-mutation";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";

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

/**
 * Builds a minimal TransactionDto fixture for test assertions.
 *
 * @returns A pending income transaction fixture.
 */
const makeTransactionDto = (): TransactionDto => ({
	id: "txn-99",
	title: "Internet",
	amount: "150.00",
	type: "expense",
	due_date: "2026-04-05",
	description: null,
	observation: null,
	is_recurring: true,
	is_installment: false,
	installment_count: null,
	currency: "BRL",
	status: "paid",
	start_date: null,
	end_date: null,
	tag_id: null,
	account_id: null,
	credit_card_id: null,
	installment_group_id: null,
	paid_at: "2026-04-05T10:00:00.000Z",
	created_at: "2026-03-01T00:00:00.000Z",
	updated_at: "2026-04-05T10:00:00.000Z",
});

describe("useMarkTransactionPaidMutation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useMutationMock.mockImplementation((opts: unknown) => opts);
	});

	it("calls client.updateStatus with status 'paid'", async () => {
		const dto = makeTransactionDto();
		const client = { updateStatus: vi.fn().mockResolvedValue(dto) };

		const mutation = useMarkTransactionPaidMutation(client as never) as unknown as {
			mutationFn: (id: string) => Promise<TransactionDto>;
		};

		const result = await mutation.mutationFn("txn-99");

		expect(client.updateStatus).toHaveBeenCalledWith("txn-99", "paid");
		expect(result).toEqual(dto);
	});

	it("invalidates the transactions list cache on success", async () => {
		const client = { updateStatus: vi.fn().mockResolvedValue(makeTransactionDto()) };

		const mutation = useMarkTransactionPaidMutation(client as never) as unknown as {
			onSuccess: () => Promise<void>;
		};

		await mutation.onSuccess();

		expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["transactions", "list"] });
	});

	it("propagates errors from client.updateStatus without catching", async () => {
		const client = {
			updateStatus: vi.fn().mockRejectedValue(new Error("update status failed")),
		};

		const mutation = useMarkTransactionPaidMutation(client as never) as unknown as {
			mutationFn: (id: string) => Promise<TransactionDto>;
		};

		await expect(mutation.mutationFn("txn-99")).rejects.toThrow("update status failed");
	});

	it("returns the updated TransactionDto with paid status", async () => {
		const dto = makeTransactionDto();
		const client = { updateStatus: vi.fn().mockResolvedValue(dto) };

		const mutation = useMarkTransactionPaidMutation(client as never) as unknown as {
			mutationFn: (id: string) => Promise<TransactionDto>;
		};

		const result = await mutation.mutationFn("txn-99");

		expect(result.status).toBe("paid");
		expect(result.id).toBe("txn-99");
	});
});
