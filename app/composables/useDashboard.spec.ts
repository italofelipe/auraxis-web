import type { DashboardOverview } from "~/types/contracts";

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createDashboardApi,
  useDashboardMonthQuery,
  useDashboardOverviewQuery,
} from "./useDashboard";

const useQueryMock = vi.hoisted(() => vi.fn());
const useHttpMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

vi.mock("~/composables/useHttp", () => ({
  useHttp: useHttpMock,
}));

describe("useDashboard composable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("busca overview no endpoint de dashboard", async () => {
    const get = vi.fn().mockResolvedValue({
      data: {
        currentBalance: 100,
        monthly: [
          {
            month: "2026-02",
            incomes: 120,
            expenses: 20,
            balance: 100,
          },
        ],
      },
    });

    const dashboardApi = createDashboardApi({ get });
    const response = await dashboardApi.getOverview();

    expect(get).toHaveBeenCalledWith("/dashboard/overview");
    expect(response.currentBalance).toBe(100);
    expect(response.monthly[0]?.month).toBe("2026-02");
  });

  it("retorna overview remoto quando query executa com sucesso", async () => {
    const remoteOverview: DashboardOverview = {
      currentBalance: 999,
      monthly: [{ month: "2026-05", incomes: 1200, expenses: 200, balance: 1000 }],
    };

    useHttpMock.mockReturnValue({
      get: vi.fn().mockResolvedValue({ data: remoteOverview }),
    });
    useQueryMock.mockImplementation((options: { queryFn: () => Promise<DashboardOverview> }) => options);

    const query = useDashboardOverviewQuery() as unknown as {
      queryFn: () => Promise<DashboardOverview>;
    };
    const result = await query.queryFn();

    expect(result).toEqual(remoteOverview);
  });

  it("retorna placeholder quando overview falha", async () => {
    useHttpMock.mockReturnValue({
      get: vi.fn().mockRejectedValue(new Error("network")),
    });
    useQueryMock.mockImplementation((options: { queryFn: () => Promise<DashboardOverview> }) => options);

    const query = useDashboardOverviewQuery() as unknown as {
      queryFn: () => Promise<DashboardOverview>;
    };
    const result = await query.queryFn();

    expect(result.currentBalance).toBeGreaterThan(0);
    expect(result.monthly.length).toBeGreaterThan(0);
  });

  it("retorna snapshot do mes selecionado quando existe", () => {
    const overview: DashboardOverview = {
      currentBalance: 100,
      monthly: [
        { month: "2026-01", incomes: 100, expenses: 50, balance: 50 },
        { month: "2026-02", incomes: 200, expenses: 80, balance: 120 },
      ],
    };

    useQueryMock
      .mockReturnValueOnce({ data: { value: overview } })
      .mockImplementationOnce((options: { queryFn: () => unknown }) => options);

    const monthQuery = useDashboardMonthQuery(() => "2026-02") as unknown as {
      queryFn: () => {
        month: string;
        incomes: number;
        expenses: number;
        balance: number;
      };
    };
    const result = monthQuery.queryFn();

    expect(result.month).toBe("2026-02");
    expect(result.balance).toBe(120);
  });

  it("retorna fallback do primeiro mes quando mes selecionado nao existe", () => {
    const overview: DashboardOverview = {
      currentBalance: 200,
      monthly: [{ month: "2026-03", incomes: 300, expenses: 200, balance: 100 }],
    };

    useQueryMock
      .mockReturnValueOnce({ data: { value: overview } })
      .mockImplementationOnce((options: { queryFn: () => unknown }) => options);

    const monthQuery = useDashboardMonthQuery(() => "2027-01") as unknown as {
      queryFn: () => { month: string };
    };
    const result = monthQuery.queryFn();

    expect(result.month).toBe("2026-03");
  });

  it("retorna snapshot vazio quando overview nao possui itens mensais", () => {
    const overview: DashboardOverview = {
      currentBalance: 0,
      monthly: [],
    };

    useQueryMock
      .mockReturnValueOnce({ data: { value: overview } })
      .mockImplementationOnce((options: { queryFn: () => unknown }) => options);

    const monthQuery = useDashboardMonthQuery(() => "2030-01") as unknown as {
      queryFn: () => {
        month: string;
        incomes: number;
        expenses: number;
        balance: number;
      };
    };
    const result = monthQuery.queryFn();

    expect(result).toEqual({
      month: "1970-01",
      incomes: 0,
      expenses: 0,
      balance: 0,
    });
  });
});
