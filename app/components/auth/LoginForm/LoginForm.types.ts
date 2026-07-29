export interface LoginFormProps {
  /** Exibe estado de carregamento no botão de submit */
  loading?: boolean
  /** Aviso acolhedor exibido acima do formulário (ex.: quem veio do checkout com conta já existente). */
  notice?: string
}

export interface LoginFormEmits {
  (e: "submit", values: { email: string; password: string }): void
}
