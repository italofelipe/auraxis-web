export interface SignupFormProps {
  /** Exibe estado de carregamento no botão de submit */
  loading?: boolean
}

export interface SignupFormEmits {
  (e: "submit", values: { email: string; password: string; confirmPassword: string }): void
}
