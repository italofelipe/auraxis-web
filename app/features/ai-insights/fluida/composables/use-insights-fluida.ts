import {
  computed,
  type ComputedRef,
  type MaybeRefOrGetter,
  ref,
  type Ref,
  toValue,
} from "vue";

import type {
  InsightDimension,
  InsightFluidaFieldsDTO,
} from "~/features/ai-insights/contracts/ai-insight";

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
import { hasFluidaPayload, insightToFluidaVM } from "../model/insight-to-fluida-vm";

/**
 * Inputs for {@link useInsightsFluida}. All optional so production callers can
 * mount the screen with no arguments while tests inject deterministic state.
 */
export interface UseInsightsFluidaOptions {
  /**
   * Full source override. When set, the screen derives from it verbatim and the
   * real-data mapper is bypassed (kept for the mock/storybook path and tests).
   */
  readonly source?: FluidaInsightSource;
  /**
   * The real enriched `/ai/insights` payload (additive Fluida fields). Mapped
   * onto the mock skeleton per `{ dimension, cadence }`; absent/empty falls back
   * to the mock so the screen is never empty.
   */
  readonly insight?: MaybeRefOrGetter<InsightFluidaFieldsDTO | null | undefined>;
  /**
   * The dimension the screen is reading. Defaults to `general` (the /insights
   * hub). Drives which node the real payload overlays onto.
   */
  readonly dimension?: MaybeRefOrGetter<InsightDimension>;
}

export interface UseInsightsFluida {
  readonly cadence: Ref<FluidaCadence>;
  readonly theme: Ref<FluidaThemeId>;
  readonly tabs: ComputedRef<readonly FluidaThemeMeta[]>;
  readonly view: ComputedRef<FluidaView>;
  /** True when the derived source came from a real enriched payload (not the mock). */
  readonly usingRealData: ComputedRef<boolean>;
  readonly setCadence: (cadence: FluidaCadence) => void;
  readonly setTheme: (theme: FluidaThemeId) => void;
}

/**
 * Reactive façade over {@link deriveFluidaView} wired to the real AI payload.
 *
 * Holds the masthead selection (cadence + theme) and exposes the derived view
 * plus the tab list. The source is resolved reactively: an explicit `source`
 * override wins; otherwise the real `insight` payload is mapped via
 * {@link insightToFluidaVM} (falling back to the Fluida mock when the additive
 * fields are absent, so the screen is never empty). All transformation logic
 * lives in the pure model modules — this composable only wires reactivity.
 *
 * @param options Source/insight/dimension inputs. Defaults to the mock.
 * @returns Reactive selection state, derived view and tab metadata.
 */
export function useInsightsFluida(
  options: UseInsightsFluidaOptions = {},
): UseInsightsFluida {
  const cadence = ref<FluidaCadence>("daily");
  const theme = ref<FluidaThemeId>("general");

  const insight = computed<InsightFluidaFieldsDTO | null | undefined>(() =>
    options.insight !== undefined ? toValue(options.insight) : null,
  );
  const dimension = computed<InsightDimension>(() =>
    options.dimension !== undefined ? toValue(options.dimension) : "general",
  );

  const usingRealData = computed<boolean>(
    () => options.source === undefined && hasFluidaPayload(insight.value ?? undefined),
  );

  const source = computed<FluidaInsightSource>(() => {
    if (options.source !== undefined) {
      return options.source;
    }
    return insightToFluidaVM(insight.value ?? undefined, {
      dimension: dimension.value,
      cadence: cadence.value,
    });
  });

  const tabs = computed<readonly FluidaThemeMeta[]>(() =>
    FLUIDA_THEME_ORDER.map((id) => resolveFluidaThemeMeta(source.value, id)),
  );

  const view = computed<FluidaView>(() =>
    deriveFluidaView(source.value, { cadence: cadence.value, theme: theme.value }),
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

  return { cadence, theme, tabs, view, usingRealData, setCadence, setTheme };
}
