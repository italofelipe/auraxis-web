import { describe, expect, it, vi } from "vitest";
import type { AxiosInstance } from "axios";
import { createUserProfileApi } from "./user-profile-api";
import type { UserProfileDto } from "../contracts/user-profile.dto";

/**
 * Builds a complete UserProfileDto fixture for testing.
 *
 * @returns Fully populated UserProfileDto fixture.
 */
const makeProfileDto = (): UserProfileDto => ({
  id: "uuid-1",
  name: "Test User",
  email: "test@example.com",
  gender: "masculino",
  birth_date: "1990-01-01",
  monthly_income: 5000,
  monthly_income_net: 5000,
  net_worth: 50000,
  monthly_expenses: 2000,
  initial_investment: null,
  monthly_investment: null,
  investment_goal_date: null,
  state_uf: "SP",
  occupation: "Dev",
  investor_profile: "conservador",
  financial_objectives: "Aposentadoria",
  investor_profile_suggested: null,
  profile_quiz_score: null,
  taxonomy_version: null,
});

/**
 * Creates a minimal mock Axios instance for testing.
 *
 * @param getReturn Value for get() to resolve with.
 * @param putReturn Value for put() to resolve with.
 * @returns Mocked Axios instance.
 */
function makeMockHttp(
  getReturn: unknown = {},
  putReturn: unknown = {},
): AxiosInstance {
  return {
    get: vi.fn().mockResolvedValue(getReturn),
    put: vi.fn().mockResolvedValue(putReturn),
  } as unknown as AxiosInstance;
}

describe("createUserProfileApi", () => {
  it("getProfile calls GET /user/profile and returns the data field", async () => {
    const dto = makeProfileDto();
    const http = makeMockHttp({ data: { message: "ok", data: dto } });
    const api = createUserProfileApi(http);

    const result = await api.getProfile();

    expect(http.get).toHaveBeenCalledWith("/user/profile");
    expect(result).toEqual(dto);
  });

  it("updateProfile calls PUT /user/profile with payload and returns the data field", async () => {
    const dto = makeProfileDto();
    const http = makeMockHttp({}, { data: { message: "ok", data: dto } });
    const api = createUserProfileApi(http);

    const payload = {
      gender: "masculino",
      birth_date: "1990-01-01",
      monthly_income: "5000",
      net_worth: "50000",
      monthly_expenses: "2000",
      state_uf: "SP",
      occupation: "Dev",
      investor_profile: "conservador",
      financial_objectives: "Aposentadoria",
    };

    const result = await api.updateProfile(payload);

    expect(http.put).toHaveBeenCalledWith("/user/profile", payload);
    expect(result).toEqual(dto);
  });
});
