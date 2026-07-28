<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRuntimeConfig } from "#app";

// #1211: com o link-map por surface (#1176) o chrome compartilhado funciona
// no apex — os links de produto atravessam para o host do app. Quem decide
// esconder o chrome agora é a PÁGINA (checkout é standalone por design),
// não a surface. Única exceção estrutural: a home do apex renderiza o
// LandingRoot, que traz LandingHeader/LandingFooter próprios — o chrome
// compartilhado duplicaria o header.
const config = useRuntimeConfig();
const route = useRoute();
// O i18n browser-detect leva quem tem browser em inglês para /en, então a home
// da landing também responde sob o prefixo de locale (#1228) — comparar o path
// cru deixava os dois headers na tela.
const isLandingHome = computed((): boolean => {
  if (config.public.siteSurface !== "landing") {
    return false;
  }
  const path = route.path.replace(/^\/en(?=\/|$)/, "") || "/";
  return path === "/" || path === "";
});
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
