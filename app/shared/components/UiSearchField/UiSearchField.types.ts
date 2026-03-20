export interface UiSearchFieldProps {
  modelValue: string
  placeholder?: string
  disabled?: boolean
}

export interface UiSearchFieldEmits {
  (e: "update:modelValue", value: string): void
  (e: "clear"): void
}
