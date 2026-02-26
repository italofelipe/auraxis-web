import { defineStore } from "pinia";

interface SessionState {
  accessToken: string | null;
  userEmail: string | null;
}

export const useSessionStore = defineStore("session", {
  state: (): SessionState => ({
    accessToken: null,
    userEmail: null,
  }),
  getters: {
    isAuthenticated: (state): boolean => state.accessToken !== null,
  },
  actions: {
    signIn(accessToken: string, userEmail: string): void {
      this.accessToken = accessToken;
      this.userEmail = userEmail;
    },
    signOut(): void {
      this.accessToken = null;
      this.userEmail = null;
    },
  },
});
