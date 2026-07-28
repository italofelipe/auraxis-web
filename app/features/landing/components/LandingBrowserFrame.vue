<script setup lang="ts">
import { computed } from "vue";

interface Props {
  /** Address-bar text shown above the screenshot (product URL). */
  url: string;
  /** Screenshot source path. */
  src: string;
  /** Real alt text describing the product screen. */
  alt: string;
  /** Loading strategy — `eager` only for the above-the-fold hero shot. */
  loading?: "lazy" | "eager";
  /** Fetch priority hint forwarded to the image. */
  fetchpriority?: "auto" | "high" | "low";
}

const props = withDefaults(defineProps<Props>(), {
  loading: "lazy",
  fetchpriority: "auto",
});

// Variantes responsivas (#1232): as capturas existem em 640/960/1440/1920w e
// no mobile o browser passa a baixar ~35KB no lugar de 93KB. O `sizes` reflete
// o CSS real do frame — sem ele o browser assume 100vw e pega a maior.
const srcset = computed((): string => {
  const base = props.src.replace(/\.webp$/, "");
  return [640, 960, 1440]
    .map((w) => `${base}-${w}w.webp ${w}w`)
    .concat(`${props.src} 1920w`)
    .join(", ");
});
</script>

<template>
  <figure class="landing-frame">
    <figcaption class="landing-frame__bar">
      <span class="landing-frame__dots" aria-hidden="true"><i /><i /><i /></span>
      <span class="landing-frame__url">{{ url }}</span>
    </figcaption>
    <UiImage
      :src="src"
      :srcset="srcset"
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 980px"
      :alt="alt"
      width="1440"
      height="900"
      :loading="loading"
      :fetchpriority="fetchpriority"
    />
  </figure>
</template>

<style scoped>
.landing-frame {
  margin: 0;
  border: 1px solid var(--landing-line);
  border-radius: var(--landing-radius-frame);
  background: var(--landing-bg-raised);
  box-shadow: var(--landing-shadow-frame);
  overflow: hidden;
}

.landing-frame__bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--landing-line-soft);
}

.landing-frame__dots {
  display: inline-flex;
  gap: 6px;
}

.landing-frame__dots i {
  width: 10px;
  height: 10px;
  border-radius: var(--landing-radius-pill);
  background: var(--landing-line);
}

.landing-frame__url {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding-inline: var(--space-3);
  border-radius: var(--landing-radius-pill);
  background: rgba(255, 255, 255, 0.05);
  color: var(--landing-muted);
  font-family: var(--font-mono);
  font-size: var(--landing-size-fine);
}

.landing-frame :deep(img) {
  display: block;
  width: 100%;
  height: auto;
}
</style>
