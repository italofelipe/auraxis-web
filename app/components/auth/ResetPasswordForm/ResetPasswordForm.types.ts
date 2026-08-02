export interface ResetPasswordFormProps {
  /** Exibe estado de carregamento no botão de submit */
  loading?: boolean
  /** Mensagem de erro vinda da API, exibida acima do botão */
  serverError?: string | null
}

export interface ResetPasswordFormEmits {
  (e: "submit", values: { password: string }): void
}
