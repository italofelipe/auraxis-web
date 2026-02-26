<script setup lang="ts">
import { useSessionStore } from "~/stores/session";

const sessionStore = useSessionStore();

await navigateTo(sessionStore.isAuthenticated ? "/dashboard" : "/login");
</script>
