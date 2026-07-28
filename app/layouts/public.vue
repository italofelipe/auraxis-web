<script setup lang="ts">
import { computed } from "vue";

// #1211: com o link-map por surface (#1176) o chrome compartilhado funciona
// no apex — os links de produto atravessam para o host do app. Quem decide
// esconder o chrome agora é a PÁGINA (checkout é standalone por design),
// não a surface. Única exceção estrutural: a home do apex renderiza o
// LandingRoot, que traz LandingHeader/LandingFooter próprios — o chrome
// compartilhado duplicaria o header.
const config = useRuntimeConfig();
const route = useRoute();
const isLandingHome = computed(
  (): boolean => config.public.siteSurface === "landing" && route.path === "/",
);
const showChrome = computed(
  (): boolean => route.meta.publicChrome !== false && !isLandingHome.value,
);
</script>

<template>
  <div class="public-layout">
    <UiPublicHeader v-if="showChrome" />
    <main id="main-content" class="public-layout__main" tabindex="-1">
      <slot />
    </main>
    <UiPublicFooter v-if="showChrome" />
  </div>
</template>

<style scoped>
.public-layout {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.public-layout__main {
  flex: 1;
  outline: none;
}
</style>
