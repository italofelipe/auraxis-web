/** Raw user profile shape as returned by the API. */
export interface UserProfileDto {
  id: string;
  name: string;
  email: string;
  gender: string | null;
  birth_date: string | null;
  monthly_income: number | null;
  monthly_income_net: number | null;
  net_worth: number | null;
  monthly_expenses: number | null;
  initial_investment: number | null;
  monthly_investment: number | null;
  investment_goal_date: string | null;
  state_uf: string | null;
  occupation: string | null;
  investor_profile: string | null;
  financial_objectives: string | null;
  investor_profile_suggested: string | null;
  profile_quiz_score: number | null;
  taxonomy_version: string | null;
}

/**
 * Standard v2 success envelope used by all Auraxis API endpoints when the
 * request carries the `X-API-Contract: v2` header.
 */
export interface V2SuccessResponse<T> {
  readonly success: boolean;
  readonly message: string;
  readonly data: T;
  readonly meta?: Record<string, unknown>;
}

/** Data payload inside the `GET /user/me` v2 response. */
export interface GetUserMeResponseData {
  /** Full user profile. */
  readonly user: UserProfileDto;
}

/** Full v2 response from `GET /user/me`. */
export type GetUserMeResponse = V2SuccessResponse<GetUserMeResponseData>;

/** Data payload inside the `PUT /user/profile` v2 response. */
export interface UpdateUserProfileResponseData {
  /** Updated user profile. */
  readonly user: UserProfileDto;
}

/** Full v2 response from `PUT /user/profile`. */
export type UpdateUserProfileResponse = V2SuccessResponse<UpdateUserProfileResponseData>;

/** Request body for `PUT /user/profile`. Monetary values sent as decimal strings. */
export interface UpdateUserProfileRequest {
  gender: string;
  birth_date: string;
  monthly_income: string;
  net_worth: string;
  monthly_expenses: string;
  state_uf: string;
  occupation: string;
  investor_profile: string;
  financial_objectives: string;
  initial_investment?: string;
  monthly_investment?: string;
  investment_goal_date?: string;
}
