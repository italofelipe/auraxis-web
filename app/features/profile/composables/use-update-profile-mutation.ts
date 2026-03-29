import { type UseMutationReturnType, useMutation, useQueryClient } from "@tanstack/vue-query";
import { useUserProfileApi, type UserProfileApi } from "~/features/profile/services/user-profile-api";
import type { UpdateUserProfileRequest, UserProfileDto } from "~/features/profile/contracts/user-profile.dto";
import { useUserStore } from "~/stores/user";
import { USER_PROFILE_QUERY_KEY } from "./use-user-profile-query";

/**
 * Mutation to update the authenticated user's profile.
 * On success: syncs user store and invalidates the profile query.
 *
 * @param providedApi Optional injected API for testing.
 * @returns Vue Query mutation state.
 */
export const useUpdateProfileMutation = (
  providedApi?: UserProfileApi,
): UseMutationReturnType<UserProfileDto, Error, UpdateUserProfileRequest, unknown> => {
  const api = providedApi ?? useUserProfileApi();
  const userStore = useUserStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateUserProfileRequest): Promise<UserProfileDto> =>
      api.updateProfile(payload),
    onSuccess: (updatedProfile: UserProfileDto): void => {
      userStore.setProfile(updatedProfile);
      void queryClient.invalidateQueries({ queryKey: USER_PROFILE_QUERY_KEY });
    },
  });
};
