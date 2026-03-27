/** Raw user profile shape as returned by the API (GET /user/profile, GET /user/me). */
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

/** Response envelope from GET /user/profile (legacy format). */
export interface GetUserProfileResponse {
  readonly message: string;
  readonly data: UserProfileDto;
}

/** Response envelope from PUT /user/profile (legacy format). */
export interface UpdateUserProfileResponse {
  readonly message: string;
  readonly data: UserProfileDto;
}

/** Request body for PUT /user/profile. Monetary values sent as decimal strings. */
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
