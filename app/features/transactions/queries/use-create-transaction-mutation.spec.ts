import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCreateTransactionMutation } from "./use-create-transaction-mutation";
import type {
	CreateTransactionPayload,
	TransactionDto,
} from "~/features/transactions/contracts/transaction.dto";

// ── Hoisted mocks ──────────────────────────────────────────────────────────────

const { createApiMutationMock } = vi.hoisted(() => ({
	createApiMutationMock: vi.fn(),
}));

vi.mock("~/core/query/use-api-mutation", () => ({
	createApiMutation: createApiMutationMock,
}));

/**
 * Builds a minimal CreateTransactionPayload fixture for test assertions.
 *
 * @returns A valid income transaction creation payload.
 */
const makePayload = (): CreateTransactionPayload => ({
	title: "Salário",
	amount: "5000.00",
	type: "income",
	due_date: "2026-04-01",
	status: "pending",
	is_recurring: false,
	is_installment: false,
});

/**
 * Builds a minimal TransactionDto fixture for test assertions.
 *
 * @returns A pending income transaction fixture.
 */
const makeTransactionDto = (): TransactionDto => ({
	id: "txn-1",
	title: "Salário",
	amount: "5000.00",
	type: "income",
	due_date: "2026-04-01",
	description: null,
	observation: null,
	is_recurring: false,
	is_installment: false,
	installment_count: null,
	currency: "BRL",
	status: "pending",
	start_date: null,
	end_date: null,
	tag_id: null,
	account_id: null,
	credit_card_id: null,
	installment_group_id: null,
	paid_at: null,
	created_at: "2026-04-01T00:00:00.000Z",
	updated_at: "2026-04-01T00:00:00.000Z",
});

describe("useCreateTransactionMutation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("delegates to createApiMutation with client.createTransaction", () => {
		const dto = makeTransactionDto();
		const client = { createTransaction: vi.fn().mockResolvedValue([dto]) };

		createApiMutationMock.mockImplementation(
			(fn: (p: CreateTransactionPayload) => Promise<TransactionDto[]>) => ({
				mutationFn: fn,
			}),
		);

		useCreateTransactionMutation(client as never);

		expect(createApiMutationMock).toHaveBeenCalledOnce();
	});

	it("calls client.createTransaction with the provided payload", async () => {
		const payload = makePayload();
		const dto = makeTransactionDto();
		const client = { createTransaction: vi.fn().mockResolvedValue([dto]) };

		createApiMutationMock.mockImplementation(
			(fn: (p: CreateTransactionPayload) => Promise<TransactionDto[]>) => ({
				mutationFn: fn,
			}),
		);

		const mutation = useCreateTransactionMutation(client as never) as unknown as {
			mutationFn: (p: CreateTransactionPayload) => Promise<TransactionDto[]>;
		};

		const result = await mutation.mutationFn(payload);

		expect(client.createTransaction).toHaveBeenCalledWith(payload);
		expect(result).toEqual([dto]);
	});

	it("propagates errors from client.createTransaction without catching", async () => {
		const payload = makePayload();
		const client = {
			createTransaction: vi.fn().mockRejectedValue(new Error("create failed")),
		};

		createApiMutationMock.mockImplementation(
			(fn: (p: CreateTransactionPayload) => Promise<TransactionDto[]>) => ({
				mutationFn: fn,
			}),
		);

		const mutation = useCreateTransactionMutation(client as never) as unknown as {
			mutationFn: (p: CreateTransactionPayload) => Promise<TransactionDto[]>;
		};

		await expect(mutation.mutationFn(payload)).rejects.toThrow("create failed");
	});

	it("passes invalidates option for dashboard overview cache", () => {
		const client = { createTransaction: vi.fn().mockResolvedValue([]) };

		createApiMutationMock.mockImplementation(
			(_fn: unknown, opts: unknown) => ({ options: opts }),
		);

		const result = useCreateTransactionMutation(client as never) as unknown as {
			options: { invalidates: unknown[][] };
		};

		expect(result.options.invalidates).toContainEqual(["dashboard", "overview"]);
	});
});
