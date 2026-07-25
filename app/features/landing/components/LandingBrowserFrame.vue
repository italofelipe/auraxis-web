<script setup lang="ts">
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

withDefaults(defineProps<Props>(), {
  loading: "lazy",
  fetchpriority: "auto",
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
