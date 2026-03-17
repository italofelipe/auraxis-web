/**
 * Session infrastructure re-export.
 *
 * This barrel exposes the canonical session store so consumers
 * import from `~/core/session` rather than reaching into `~/stores`.
 * The store lives in `~/stores/session.ts` for Pinia auto-discovery —
 * this facade keeps import paths stable as the structure evolves.
 */
export { useSessionStore } from "~/stores/session";
