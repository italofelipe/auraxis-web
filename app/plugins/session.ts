import { useSessionStore } from "~/stores/session";

export default defineNuxtPlugin(() => {
  const sessionStore = useSessionStore();
  sessionStore.restore();
});
