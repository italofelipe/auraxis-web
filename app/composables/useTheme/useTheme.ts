import { darkTheme, type GlobalTheme } from "naive-ui";
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref, type ComputedRef, type Ref, watch } from "vue";
import {
  defaultResolvedTheme,
  defaultThemePreference,
  type ResolvedTheme,
  type ThemePreference,
} from "~/theme/tokens/semantic";

const STORAGE_KEY = "auraxis-theme";
const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

/**
 * Checks whether a stored value is a supported theme preference.
 * @param value Value read from localStorage.
 * @returns True when the value is a valid theme preference.
 */
function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

/**
 * Reads the persisted theme preference, falling back to the product default.
 * @returns The stored or default theme preference.
 */
function readStoredPreference(): ThemePreference {
  if (!import.meta.client) {
    return defaultThemePreference;
  }

  const storedPreference = localStorage.getItem(STORAGE_KEY);
  return isThemePreference(storedPreference) ? storedPreference : defaultThemePreference;
}

/**
 * Resolves the current operating-system color scheme.
 * @returns The resolved light/dark system theme.
 */
function resolveSystemTheme(): ResolvedTheme {
  if (!import.meta.client || typeof window.matchMedia !== "function") {
    return defaultResolvedTheme;
  }

  return window.matchMedia(DARK_MEDIA_QUERY).matches ? "dark" : "light";
}

/**
 * Applies the resolved theme to the root document element.
 * @param theme Resolved light/dark theme.
 */
function applyThemeAttribute(theme: ResolvedTheme): void {
  if (!import.meta.client) {
    return;
  }

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

/**
 * Creates Nuxt-scoped theme refs, with a unit-test fallback outside Nuxt.
 * @returns Theme preference and system theme refs.
 */
function createThemeState(): {
  themePreference: Ref<ThemePreference>;
  systemTheme: Ref<ResolvedTheme>;
} {
  try {
    return {
      themePreference: useState<ThemePreference>("auraxis-theme-preference", () => defaultThemePreference),
      systemTheme: useState<ResolvedTheme>("auraxis-system-theme", () => defaultResolvedTheme),
    };
  } catch {
    return {
      themePreference: ref<ThemePreference>(defaultThemePreference),
      systemTheme: ref<ResolvedTheme>(defaultResolvedTheme),
    };
  }
}

/**
 * Syncs the stored preference and system color scheme into reactive state.
 * @param themePreference User preference ref.
 * @param systemTheme System theme ref.
 * @returns The media query list used to observe system changes.
 */
function syncFromEnvironment(
  themePreference: Ref<ThemePreference>,
  systemTheme: Ref<ResolvedTheme>,
): MediaQueryList | null {
  themePreference.value = readStoredPreference();
  systemTheme.value = resolveSystemTheme();

  if (!import.meta.client || typeof window.matchMedia !== "function") {
    return null;
  }

  return window.matchMedia(DARK_MEDIA_QUERY);
}

/**
 * Composable for resolving light, dark and system theme preferences.
 *
 * Uses Nuxt's `useState` so the reactive value is isolated per SSR request on
 * the server and shared (hydrated) on the client.  localStorage is only read
 * inside `onMounted`, which never runs during SSR, eliminating the module-level
 * singleton problem that caused `/` to return 500 during Nitro prerender.
 *
 * - Defaults to `light` when no preference is stored.
 * - Reads the user preference from `localStorage` after hydration.
 * - Supports explicit `light`/`dark` and `system`.
 * - Persists explicit user selection to `localStorage`.
 *
 * Usage in `app.vue`:
 * ```ts
 * const { naiveTheme } = useTheme()
 * // <NConfigProvider :theme="naiveTheme" ...>
 * ```
 *
 * Usage in a toggle button:
 * ```ts
 * const { isDark, toggle } = useTheme()
 * ```
 *
 * @returns Reactive theme state and toggle function.
 */
export function useTheme(): {
  themePreference: Ref<ThemePreference>;
  resolvedTheme: ComputedRef<ResolvedTheme>;
  isDark: ComputedRef<boolean>;
  setPreference: (preference: ThemePreference) => void;
  toggle: () => void;
  naiveTheme: ComputedRef<GlobalTheme | null>;
} {
  // useState creates per-request state on the server and shared state on the
  // client (after hydration), replacing the unsafe module-level ref singleton.
  // Falls back to a plain ref in environments without a Nuxt context (unit tests).
  const { themePreference, systemTheme } = createThemeState();

  let mediaQuery: MediaQueryList | null = null;
  /**
   * Updates the reactive system theme when the OS preference changes.
   * @param event Media query change event.
   */
  const handleSystemThemeChange = (event: MediaQueryListEvent): void => {
    systemTheme.value = event.matches ? "dark" : "light";
  };

  if (getCurrentInstance()) {
    onMounted(() => {
      mediaQuery = syncFromEnvironment(themePreference, systemTheme);
      mediaQuery?.addEventListener("change", handleSystemThemeChange);
    });

    onBeforeUnmount(() => {
      mediaQuery?.removeEventListener("change", handleSystemThemeChange);
    });
  } else {
    syncFromEnvironment(themePreference, systemTheme);
  }

  const resolvedTheme = computed<ResolvedTheme>(() =>
    themePreference.value === "system" ? systemTheme.value : themePreference.value,
  );

  const isDark = computed<boolean>(() => resolvedTheme.value === "dark");

  watch(resolvedTheme, applyThemeAttribute, { immediate: true });

  /**
   * Persists an explicit theme preference.
   * @param preference User-selected theme preference.
   */
  function setPreference(preference: ThemePreference): void {
    themePreference.value = preference;
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, preference);
    }
  }

  /**
   * Toggles between explicit dark and light and persists the choice.
   * @returns void
   */
  function toggle(): void {
    setPreference(isDark.value ? "light" : "dark");
  }

  /** The Naive UI theme object to pass to `NConfigProvider`. */
  const naiveTheme = computed(() => (isDark.value ? darkTheme : null));

  return { themePreference, resolvedTheme, isDark, setPreference, toggle, naiveTheme };
}
