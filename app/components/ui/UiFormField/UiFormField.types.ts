export interface UiFormFieldProps {
  /** Label do campo */
  label: string
  /** ID do input interno — para associar label via `for` */
  fieldId: string
  /** Mensagem de erro. Se definida, campo entra em estado de erro */
  error?: string
  /** Dica auxiliar abaixo do campo */
  hint?: string
  /** Campo obrigatório — exibe asterisco na label */
  required?: boolean
}
