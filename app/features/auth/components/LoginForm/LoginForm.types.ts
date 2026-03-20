export interface LoginFormProps {
  /** Exibe estado de carregamento no botão de submit */
  loading?: boolean
}

export interface LoginFormEmits {
  (e: "submit", values: { email: string; password: string }): void
}
