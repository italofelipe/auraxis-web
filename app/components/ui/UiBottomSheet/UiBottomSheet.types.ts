/** Props do UiBottomSheet. */
export interface UiBottomSheetProps {
  /** Controla a visibilidade (v-model). */
  modelValue: boolean;
  /** Largura máxima do painel. */
  maxWidth?: string;
  /** Altura máxima do painel. */
  maxHeight?: string;
  /** Fecha ao clicar no scrim (default true). */
  closeOnScrim?: boolean;
  /** Rótulo acessível do diálogo. */
  ariaLabel?: string;
}
