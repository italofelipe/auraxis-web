import { tryUseNuxtApp } from "#app";
import { buildAppUrl } from "~/features/landing/model/landing-content";

/**
 * Superfícies públicas do build multi-surface (espelha `SITE_SURFACES` do
 * `nuxt.config.ts`). A landing (apex `auraxis.com.br`) serve conteúdo público
 * mas NÃO serve o produto — links de produto precisam atravessar hosts.
 */
export type PublicSurface = "app" | "marketing" | "landing";

const KNOWN_SURFACES: readonly PublicSurface[] = ["app", "marketing", "landing"];

/**
 * Rotas que pertencem ao produto (host `app.auraxis.com.br`) e nunca são
 * servidas pelo apex — todo o resto é conteúdo público (tools, SEO landings,
 * blog, páginas legais) e permanece relativo em qualquer surface.
 */
const PRODUCT_PATH_PREFIXES = [
  "/login",
  "/register",
  "/dashboard",
  "/plans",
  "/about-us",
  "/support",
] as const;

/**
 * Um caminho de produto casa exato ou com sub-rota/query — nunca por substring.
 *
 * @param path - Caminho relativo a classificar (ex.: `/register?plan=annual`).
 * @returns `true` quando o destino pertence ao produto (host do app).
 */
export const isProductPath = (path: string): boolean =>
  PRODUCT_PATH_PREFIXES.some(
    (prefix) =>
      path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`),
  );

/**
 * Na landing (apex), destinos de produto viram absolutos para o host do app.
 *
 * @param surface - Surface pública ativa.
 * @param path - Caminho relativo de produto (ex.: `/login`).
 * @returns Href pronto para o `NuxtLink` da surface.
 */
export const resolveProductHref = (surface: PublicSurface, path: string): string =>
  surface === "landing" ? buildAppUrl(path) : path;

/**
 * Resolve qualquer link público: produto atravessa hosts na landing; conteúdo fica relativo.
 *
 * @param surface - Surface pública ativa.
 * @param path - Caminho relativo vindo de dados/conteúdo.
 * @returns Href pronto para o `NuxtLink` da surface.
 */
export const resolvePublicHref = (surface: PublicSurface, path: string): string =>
  isProductPath(path) ? resolveProductHref(surface, path) : path;

/**
 * Lê a surface ativa do runtimeConfig; fallback `app` (mesma semântica do nuxt.config).
 *
 * @returns Surface pública ativa do build corrente.
 */
export const resolveSiteSurface = (): PublicSurface => {
  const raw = (tryUseNuxtApp()?.$config.public as Record<string, unknown> | undefined)
    ?.siteSurface;
  return KNOWN_SURFACES.includes(raw as PublicSurface) ? (raw as PublicSurface) : "app";
};

interface PublicNav {
  /** Surface efetiva resolvida no setup. */
  surface: PublicSurface;
  /** Conveniência para condicionais de template. */
  isLanding: boolean;
  /** Href para destinos de produto (login/register/dashboard/…). */
  productHref: (path: string) => string;
  /** Href para qualquer link público (decide produto × conteúdo). */
  publicHref: (path: string) => string;
}

/**
 * Fachada de navegação pública por surface. Resolver no SETUP do componente,
 * nunca dentro de handlers (composables fora do setup lançam — regra #1198).
 *
 * @returns Helpers de href com a surface resolvida uma única vez.
 */
export const usePublicNav = (): PublicNav => {
  const surface = resolveSiteSurface();
  return {
    surface,
    isLanding: surface === "landing",
    productHref: (path: string): string => resolveProductHref(surface, path),
    publicHref: (path: string): string => resolvePublicHref(surface, path),
  };
};
