<script setup lang="ts">
import { computed } from "vue";
import { ArrowRight } from "lucide-vue-next";
import { buildToolRelatedLinks } from "~/features/tools/model/tool-related-links";

const props = defineProps<{
  /** Id/slug da tool atual — vazio esconde o bloco. */
  toolId: string;
}>();

const links = computed(() => buildToolRelatedLinks(props.toolId));
const tools = computed(() => links.value.filter((link) => link.kind === "tool"));
const guides = computed(() => links.value.filter((link) => link.kind === "guide"));
</script>

<template>
  <section
    v-if="links.length > 0"
    class="tool-related"
    aria-labelledby="tool-related-title"
    data-testid="tool-related-links"
  >
    <div class="tool-related__inner">
      <h2 id="tool-related-title" class="tool-related__title">Continue por aqui</h2>

      <div class="tool-related__groups">
        <div v-if="tools.length > 0" class="tool-related__group">
          <p class="tool-related__kicker">Calculadoras do mesmo tema</p>
          <nav class="tool-related__nav" aria-label="Calculadoras relacionadas">
            <NuxtLink v-for="link in tools" :key="link.to" :to="link.to" class="tool-related__link">
              {{ link.label }}
              <ArrowRight :size="14" aria-hidden="true" />
            </NuxtLink>
          </nav>
        </div>

        <div v-if="guides.length > 0" class="tool-related__group">
          <p class="tool-related__kicker">Para entender o contexto</p>
          <nav class="tool-related__nav" aria-label="Guias relacionados">
            <NuxtLink v-for="link in guides" :key="link.to" :to="link.to" class="tool-related__link">
              {{ link.label }}
              <ArrowRight :size="14" aria-hidden="true" />
            </NuxtLink>
          </nav>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tool-related {
  border-top: 1px solid var(--color-outline-soft);
  background: var(--color-bg-surface);
  padding: var(--space-8, 32px) var(--space-4, 16px);
}

.tool-related__inner {
  max-width: 960px;
  margin-inline: auto;
}

.tool-related__title {
  margin: 0 0 var(--space-5, 20px);
  font-family: var(--font-heading);
  font-size: var(--font-size-xl);
  color: var(--color-text-primary);
}

.tool-related__groups {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-5, 20px);
}

.tool-related__kicker {
  margin: 0 0 var(--space-2, 8px);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
}

.tool-related__nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1, 4px);
}

.tool-related__link {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2, 8px);
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  background: var(--color-bg-base);
  border: 1px solid var(--color-outline-subtle);
  transition:
    color 0.15s ease,
    border-color 0.15s ease;
}

.tool-related__link:hover,
.tool-related__link:focus-visible {
  color: var(--color-brand-500);
  border-color: var(--color-brand-500);
  outline: none;
}
</style>
