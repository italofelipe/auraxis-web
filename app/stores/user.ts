import { defineStore } from "pinia";
import type { UserProfileDto } from "~/features/profile/contracts/user-profile.dto";

interface UserState {
  profile: UserProfileDto | null;
  isLoaded: boolean;
}

/** Required fields that must be non-null for a profile to be considered complete. */
const REQUIRED_PROFILE_FIELDS: ReadonlyArray<keyof UserProfileDto> = [
  "gender",
  "birth_date",
  "monthly_income",
  "net_worth",
  "monthly_expenses",
  "state_uf",
  "occupation",
  "investor_profile",
  "financial_objectives",
] as const;

export const useUserStore = defineStore("user", {
  state: (): UserState => ({
    profile: null,
    isLoaded: false,
  }),
  getters: {
    displayName: (state): string => state.profile?.name ?? "",
    isProfileComplete: (state): boolean => {
      if (!state.profile) { return false; }
      return REQUIRED_PROFILE_FIELDS.every(
        (field) => state.profile?.[field] !== null && state.profile?.[field] !== undefined,
      );
    },
  },
  actions: {
    setProfile(profile: UserProfileDto): void {
      this.profile = profile;
      this.isLoaded = true;
    },
    clearProfile(): void {
      this.profile = null;
      this.isLoaded = false;
    },
  },
});
