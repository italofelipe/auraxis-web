import type { AxiosInstance } from "axios";
import { useHttp } from "~/composables/useHttp";
import type {
  GetUserMeResponse,
  PartialUpdateUserProfileRequest,
  UpdateUserProfileResponse,
  UserProfileDto,
} from "../contracts/user-profile.dto";

export interface UserProfileApi {
  getProfile(): Promise<UserProfileDto>;
  updateProfile(payload: PartialUpdateUserProfileRequest): Promise<UserProfileDto>;
}

/**
 * Creates a user profile API adapter from an Axios instance.
 *
 * @param http Axios instance configured with the Auraxis API base URL and auth.
 * @returns User profile API with getProfile and updateProfile methods.
 */
export const createUserProfileApi = (http: AxiosInstance): UserProfileApi => ({
  async getProfile(): Promise<UserProfileDto> {
    const response = await http.get<GetUserMeResponse>("/user/me");
    return response.data.data.user;
  },

  async updateProfile(payload: PartialUpdateUserProfileRequest): Promise<UserProfileDto> {
    const response = await http.put<UpdateUserProfileResponse>("/user/profile", payload);
    return response.data.data.user;
  },
});

/**
 * Resolves the canonical user profile API using the shared HTTP layer.
 *
 * @returns User profile API instance.
 */
export const useUserProfileApi = (): UserProfileApi => createUserProfileApi(useHttp());
