<script setup lang="ts">
import { computed } from "vue";

// Landing surface (#1165): the capture landing at auraxis.com.br ships its own
// header/footer with absolute links to the product app — the shared public
// chrome (relative nav + CTAs) would break on the apex domain.
const config = useRuntimeConfig();
const isLandingSurface = computed((): boolean => config.public.siteSurface === "landing");
</script>

<template>
  <div class="public-layout">
    <UiPublicHeader v-if="!isLandingSurface" />
    <main id="main-content" class="public-layout__main" tabindex="-1">
      <slot />
    </main>
    <UiPublicFooter v-if="!isLandingSurface" />
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
