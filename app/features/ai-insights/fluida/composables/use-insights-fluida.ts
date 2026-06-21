import { computed, type ComputedRef, ref, type Ref } from "vue";

import { FLUIDA_MOCK_SOURCE } from "../model/insight-fluida-mock";
import {
  deriveFluidaView,
  resolveFluidaThemeMeta,
  FLUIDA_THEME_ORDER,
  type FluidaCadence,
  type FluidaInsightSource,
  type FluidaThemeId,
  type FluidaThemeMeta,
  type FluidaView,
} from "../model/insight-fluida";

export interface UseInsightsFluida {
  readonly cadence: Ref<FluidaCadence>;
  readonly theme: Ref<FluidaThemeId>;
  readonly tabs: ComputedRef<readonly FluidaThemeMeta[]>;
  readonly view: ComputedRef<FluidaView>;
  readonly setCadence: (cadence: FluidaCadence) => void;
  readonly setTheme: (theme: FluidaThemeId) => void;
}

/**
 * Thin reactive façade over {@link deriveFluidaView}.
 *
 * Holds the masthead selection (cadence + theme) and exposes the derived view
 * model plus the tab list. All business logic lives in the pure model module;
 * this composable only wires reactivity. The source defaults to the Fluida mock
 * (behind the `web.insights.fluida` flag) and accepts an injected source so the
 * real `/ai/insights` payload can replace the mock without touching the UI.
 *
 * @param source Insight source object. Defaults to the June/2026 mock.
 * @returns Reactive selection state, derived view and tab metadata.
 */
export function useInsightsFluida(
  source: FluidaInsightSource = FLUIDA_MOCK_SOURCE,
): UseInsightsFluida {
  const cadence = ref<FluidaCadence>("daily");
  const theme = ref<FluidaThemeId>("general");

  const tabs = computed<readonly FluidaThemeMeta[]>(() =>
    FLUIDA_THEME_ORDER.map((id) => resolveFluidaThemeMeta(source, id)),
  );

  const view = computed<FluidaView>(() =>
    deriveFluidaView(source, { cadence: cadence.value, theme: theme.value }),
  );

  /**
   * Updates the selected cadence (daily/weekly), recomputing the view.
   *
   * @param next Cadence to activate.
   */
  const setCadence = (next: FluidaCadence): void => {
    cadence.value = next;
  };

  /**
   * Updates the selected theme tab, recomputing the view.
   *
   * @param next Theme id to activate.
   */
  const setTheme = (next: FluidaThemeId): void => {
    theme.value = next;
  };

  return { cadence, theme, tabs, view, setCadence, setTheme };
}
