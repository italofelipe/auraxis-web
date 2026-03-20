export interface UiPasswordFieldProps {
  /** Valor do campo (v-model) */
  modelValue: string
  /** Label do campo. Padrão: "Senha" */
  label?: string
  /** ID do input. Padrão: 'password' */
  fieldId?: string
  /** Placeholder */
  placeholder?: string
  /** Mensagem de erro */
  error?: string
  /** Campo obrigatório */
  required?: boolean
  /** Desabilitado */
  disabled?: boolean
  /** Autocomplete attr */
  autocomplete?: "current-password" | "new-password" | "off"
}

export interface UiPasswordFieldEmits {
  (e: "update:modelValue", value: string): void
}
