<script setup lang="ts">
import { computed } from "vue";

/**
 * Canonical image wrapper for the Auraxis web app (PERF-6).
 *
 * `@nuxt/image` was removed from the module stack because its `sharp`
 * dependency breaks ARM64 Docker builds. This component is the lightweight
 * alternative: it forwards to a native `<img>` while setting the defaults
 * modern browsers need for performant image rendering without a runtime cost.
 *
 * Defaults:
 * - `loading="lazy"` — defer offscreen images to improve LCP on first paint
 * - `decoding="async"` — off-main-thread decode
 * - explicit `width`/`height` — reserve layout space to avoid CLS
 *
 * Use `eager` priority for above-the-fold hero images that must not be lazy.
 */
type Loading = "lazy" | "eager";
type Decoding = "async" | "sync" | "auto";
type FetchPriority = "auto" | "high" | "low";

interface Props {
  /** Image source URL. Required for rendering. */
  src: string | null | undefined;
  /** Accessible alt text. Empty string is valid for decorative images. */
  alt: string;
  /** Intrinsic width in pixels (prevents layout shift). */
  width: number | string;
  /** Intrinsic height in pixels (prevents layout shift). */
  height: number | string;
  /** Loading strategy. Defaults to `"lazy"`. */
  loading?: Loading;
  /** Decoding strategy. Defaults to `"async"`. */
  decoding?: Decoding;
  /** Fetch priority hint. Defaults to `"auto"`. Use `"high"` for LCP hero. */
  fetchpriority?: FetchPriority;
}

const props = withDefaults(defineProps<Props>(), {
  loading: "lazy",
  decoding: "async",
  fetchpriority: "auto",
});

const hasSrc = computed<boolean>((): boolean => Boolean(props.src));
</script>

<template>
  <img
    v-if="hasSrc"
    :src="src ?? ''"
    :alt="alt"
    :width="width"
    :height="height"
    :loading="loading"
    :decoding="decoding"
    :fetchpriority="fetchpriority"
    class="ui-image"
  >
</template>

<style scoped>
.ui-image {
  display: block;
  max-width: 100%;
  height: auto;
}
</style>
