export interface UiSegmentedControlOption<T extends string = string> {
  value: T
  label: string
  disabled?: boolean
}

export interface UiSegmentedControlProps<T extends string = string> {
  modelValue: T
  options: UiSegmentedControlOption<T>[]
  /** Acessibilidade: label do grupo */
  ariaLabel?: string
}

export interface UiSegmentedControlEmits<T extends string = string> {
  (e: "update:modelValue", value: T): void
}
