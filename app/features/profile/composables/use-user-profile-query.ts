import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";
import { useUserProfileApi, type UserProfileApi } from "~/features/profile/api/user-profile-api";
import type { UserProfileDto } from "~/features/profile/contracts/user-profile.dto";
import { useUserStore } from "~/stores/user";
import { useSessionStore } from "~/stores/session";

export const USER_PROFILE_QUERY_KEY = ["user", "profile"] as const;

/**
 * Queries the authenticated user's profile and syncs it to the user store.
 *
 * @param providedApi Optional injected API for testing.
 * @returns Vue Query state for the user profile.
 */
export const useUserProfileQuery = (
  providedApi?: UserProfileApi,
): UseQueryReturnType<UserProfileDto, Error> => {
  const api = providedApi ?? useUserProfileApi();
  const sessionStore = useSessionStore();
  const userStore = useUserStore();

  return useQuery({
    queryKey: USER_PROFILE_QUERY_KEY,
    queryFn: async (): Promise<UserProfileDto> => {
      const profile = await api.getProfile();
      userStore.setProfile(profile);
      return profile;
    },
    enabled: computed(() => sessionStore.isAuthenticated),
  });
};
