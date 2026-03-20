import { computed, type ComputedRef } from "vue";
import { useRoute } from "#app";

/**
 * Classification of a route from a visibility and SEO perspective.
 * - `public`         — indexable, no auth required
 * - `public-noindex` — not indexed, no auth required (e.g. auth pages)
 * - `private`        — auth required, not indexed
 */
export type RouteClass = "public" | "public-noindex" | "private";

/** Routes that are publicly accessible and should be indexed. */
const PUBLIC_ROUTES = ["/", "/tools", "/termos", "/privacidade"];

/** Routes that are publicly accessible but must NOT be indexed. */
const NOINDEX_ROUTES = ["/login", "/register", "/forgot-password"];

/**
 * Resolves the classification of the current route.
 * @returns An object containing a reactive `routeClass` computed ref.
 */
export function useRouteClassification(): { routeClass: ComputedRef<RouteClass> } {
  const route = useRoute();

  const routeClass = computed<RouteClass>(() => {
    const path = route.path;

    if (PUBLIC_ROUTES.includes(path)) {
      return "public";
    }

    if (NOINDEX_ROUTES.includes(path)) {
      return "public-noindex";
    }

    return "private";
  });

  return { routeClass };
}
