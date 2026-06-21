<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    text: string;
    /** Render the first letter as an editorial drop-cap (capitular). */
    lead?: boolean;
    /** Accent colour token for the drop-cap. */
    accentColor?: string;
  }>(),
  {
    lead: false,
    accentColor: "var(--fluida-brand)",
  },
);

const firstLetter = computed(() => (props.lead ? props.text.slice(0, 1) : ""));
const remainder = computed(() => (props.lead ? props.text.slice(1) : props.text));
</script>

<template>
  <p class="fluida-text" :class="{ 'fluida-text--lead': lead }">
    <span
      v-if="lead"
      class="fluida-text__capital"
      :style="{ color: accentColor }"
      aria-hidden="true"
      >{{ firstLetter }}</span
    >{{ remainder }}
  </p>
</template>

<style scoped>
.fluida-text {
  margin: 0;
  font-size: var(--fluida-size-prose);
  line-height: var(--fluida-leading-prose);
  color: var(--fluida-body);
}

.fluida-text__capital {
  float: left;
  font-family: var(--fluida-font-serif);
  font-size: var(--fluida-size-capital);
  line-height: 0.82;
  font-weight: var(--fluida-weight-headline);
  padding-right: var(--space-2);
  padding-top: 3px;
}
</style>
