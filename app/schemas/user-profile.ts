import { z } from "zod";

export const GENDER_OPTIONS = ["masculino", "feminino", "outro"] as const;
export const INVESTOR_PROFILE_OPTIONS = ["conservador", "explorador", "entusiasta"] as const;

export const BRAZIL_UF_OPTIONS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
] as const;

export const userProfileSchema = z.object({
  gender: z.enum(GENDER_OPTIONS, { required_error: "Selecione o gênero." }),
  birth_date: z.string().min(1, "Informe a data de nascimento."),
  monthly_income: z.coerce
    .number({ invalid_type_error: "Informe um valor válido." })
    .nonnegative("O valor não pode ser negativo."),
  net_worth: z.coerce
    .number({ invalid_type_error: "Informe um valor válido." })
    .nonnegative("O valor não pode ser negativo."),
  monthly_expenses: z.coerce
    .number({ invalid_type_error: "Informe um valor válido." })
    .nonnegative("O valor não pode ser negativo."),
  state_uf: z.enum(BRAZIL_UF_OPTIONS, { required_error: "Selecione o estado." }),
  occupation: z
    .string()
    .min(1, "Informe a profissão.")
    .max(128, "Máximo de 128 caracteres."),
  investor_profile: z.enum(INVESTOR_PROFILE_OPTIONS, {
    required_error: "Selecione o perfil de investidor.",
  }),
  financial_objectives: z.string().min(1, "Informe seus objetivos financeiros."),
  initial_investment: z.coerce
    .number({ invalid_type_error: "Informe um valor válido." })
    .nonnegative("O valor não pode ser negativo.")
    .optional(),
  monthly_investment: z.coerce
    .number({ invalid_type_error: "Informe um valor válido." })
    .nonnegative("O valor não pode ser negativo.")
    .optional(),
  investment_goal_date: z.string().optional(),
});

export type UserProfileSchema = z.infer<typeof userProfileSchema>;
