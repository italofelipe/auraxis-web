export interface ForgotPasswordFormProps {
  /** Exibe estado de carregamento no botão de submit */
  loading?: boolean
  /** Se true, exibe mensagem de sucesso (e-mail enviado) em vez do formulário */
  success?: boolean
}

export interface ForgotPasswordFormEmits {
  (e: "submit", values: { email: string }): void
}
