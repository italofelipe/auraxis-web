import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { useUserStore } from "./user";
import type { UserProfileDto } from "~/features/profile/contracts/user-profile.dto";

/**
 * Builds a complete UserProfileDto fixture with optional field overrides.
 *
 * @param overrides Partial overrides to apply to the base fixture.
 * @returns Full UserProfileDto fixture.
 */
const makeProfile = (overrides: Partial<UserProfileDto> = {}): UserProfileDto => ({
  id: "abc-123",
  name: "João Silva",
  email: "joao@example.com",
  gender: "masculino",
  birth_date: "1990-01-01",
  monthly_income: 5000,
  monthly_income_net: 5000,
  net_worth: 100000,
  monthly_expenses: 2000,
  initial_investment: null,
  monthly_investment: null,
  investment_goal_date: null,
  state_uf: "SP",
  occupation: "Engenheiro",
  investor_profile: "conservador",
  financial_objectives: "Aposentadoria",
  investor_profile_suggested: null,
  profile_quiz_score: null,
  taxonomy_version: null,
  ...overrides,
});

describe("useUserStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("starts with null profile and isLoaded false", () => {
    const store = useUserStore();
    expect(store.profile).toBeNull();
    expect(store.isLoaded).toBe(false);
  });

  it("setProfile stores the profile and sets isLoaded to true", () => {
    const store = useUserStore();
    const profile = makeProfile();
    store.setProfile(profile);
    expect(store.profile).toEqual(profile);
    expect(store.isLoaded).toBe(true);
  });

  it("clearProfile resets profile to null and isLoaded to false", () => {
    const store = useUserStore();
    store.setProfile(makeProfile());
    store.clearProfile();
    expect(store.profile).toBeNull();
    expect(store.isLoaded).toBe(false);
  });

  it("displayName returns the profile name when set", () => {
    const store = useUserStore();
    store.setProfile(makeProfile({ name: "Maria Santos" }));
    expect(store.displayName).toBe("Maria Santos");
  });

  it("displayName returns empty string when profile is null", () => {
    const store = useUserStore();
    expect(store.displayName).toBe("");
  });

  it("isProfileComplete returns true when all required fields are present", () => {
    const store = useUserStore();
    store.setProfile(makeProfile());
    expect(store.isProfileComplete).toBe(true);
  });

  it("isProfileComplete returns false when profile is null", () => {
    const store = useUserStore();
    expect(store.isProfileComplete).toBe(false);
  });

  it("isProfileComplete returns false when a required field is null", () => {
    const store = useUserStore();
    store.setProfile(makeProfile({ gender: null }));
    expect(store.isProfileComplete).toBe(false);
  });

  it("isProfileComplete returns false when investor_profile is null", () => {
    const store = useUserStore();
    store.setProfile(makeProfile({ investor_profile: null }));
    expect(store.isProfileComplete).toBe(false);
  });
});
