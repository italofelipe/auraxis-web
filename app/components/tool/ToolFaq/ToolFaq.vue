<script setup lang="ts">
import { computed } from "vue";
import { getToolFaqs } from "~/features/tools/content/tool-faqs-registry";

const props = defineProps<{
  /** Slug da calculadora atual — vazio esconde o bloco. */
  toolId: string;
}>();

const faqs = computed(() => getToolFaqs(props.toolId));
</script>

<template>
  <section
    v-if="faqs.length > 0"
    class="tool-faq"
    aria-labelledby="tool-faq-title"
    data-testid="tool-faq"
  >
    <div class="tool-faq__inner">
      <h2 id="tool-faq-title" class="tool-faq__title">Perguntas frequentes</h2>

      <!-- <details> em vez de acordeão com JS: o conteúdo fica no HTML desde o
           primeiro paint (o schema precisa espelhar texto visível) e funciona
           sem hidratação. -->
      <details v-for="faq in faqs" :key="faq.question" class="tool-faq__item">
        <summary class="tool-faq__question">{{ faq.question }}</summary>
        <p class="tool-faq__answer">{{ faq.answer }}</p>
      </details>
    </div>
  </section>
</template>

<style scoped>
.tool-faq {
  border-top: 1px solid var(--color-outline-soft);
  background: var(--color-bg-base);
  padding: var(--space-8, 32px) var(--space-4, 16px);
}

.tool-faq__inner {
  max-width: 960px;
  margin-inline: auto;
}

.tool-faq__title {
  margin: 0 0 var(--space-4, 16px);
  font-family: var(--font-heading);
  font-size: var(--font-size-xl);
  color: var(--color-text-primary);
}

.tool-faq__item {
  border: 1px solid var(--color-outline-subtle);
  border-radius: var(--radius-sm);
  background: var(--color-bg-surface);
  margin-bottom: var(--space-2, 8px);
}

.tool-faq__question {
  cursor: pointer;
  list-style: none;
  padding: 14px 16px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

/* Seta própria: o marcador nativo do <summary> não é estilizável no Safari. */
.tool-faq__question::-webkit-details-marker {
  display: none;
}

.tool-faq__question::after {
  content: "+";
  float: right;
  font-size: var(--font-size-md);
  color: var(--color-text-muted);
  transition: transform 0.15s ease;
}

.tool-faq__item[open] .tool-faq__question::after {
  content: "−";
}

.tool-faq__question:focus-visible {
  outline: 2px solid var(--color-brand-500);
  outline-offset: -2px;
}

.tool-faq__answer {
  margin: 0;
  padding: 0 16px 16px;
  font-size: var(--font-size-sm);
  line-height: 1.6;
  color: var(--color-text-secondary);
}
</style>
