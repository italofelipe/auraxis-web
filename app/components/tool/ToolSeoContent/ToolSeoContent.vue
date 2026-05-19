<script setup lang="ts">
import { ArrowRight } from "lucide-vue-next";
import type { ToolSeoContentProps } from "~/features/tools/model/tool-seo-content";

defineProps<ToolSeoContentProps>();

const headingId = "tool-seo-content-title";
</script>

<template>
  <section class="tool-seo-content" :aria-labelledby="headingId">
    <div class="tool-seo-content__header">
      <p class="tool-seo-content__eyebrow">Guia rápido</p>
      <h2 :id="headingId">{{ title }}</h2>
      <p>{{ description }}</p>
    </div>

    <div class="tool-seo-content__grid">
      <article class="tool-seo-content__faq" aria-label="Perguntas frequentes">
        <h3>Perguntas frequentes</h3>
        <dl class="tool-seo-content__faq-list">
          <div
            v-for="faq in faqs"
            :key="faq.question"
            class="tool-seo-content__faq-item"
          >
            <dt>{{ faq.question }}</dt>
            <dd>{{ faq.answer }}</dd>
          </div>
        </dl>
      </article>

      <aside class="tool-seo-content__side" aria-label="Continue planejando">
        <div class="tool-seo-content__cta">
          <span>{{ cta.eyebrow }}</span>
          <h3>{{ cta.title }}</h3>
          <p>{{ cta.body }}</p>
          <NuxtLink class="tool-seo-content__cta-link" :to="cta.to">
            {{ cta.label }}
            <ArrowRight :size="16" aria-hidden="true" />
          </NuxtLink>
        </div>

        <div class="tool-seo-content__links">
          <h3>Continue seu planejamento</h3>
          <NuxtLink
            v-for="link in relatedLinks"
            :key="link.to"
            class="tool-seo-content__link"
            :to="link.to"
          >
            <strong>{{ link.label }}</strong>
            <span>{{ link.description }}</span>
          </NuxtLink>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.tool-seo-content {
  display: grid;
  gap: var(--space-5);
  margin-top: var(--space-6);
  padding: var(--space-5);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(135deg, var(--color-brand-glow-2xs), transparent 42%),
    var(--color-bg-surface);
  box-shadow: var(--shadow-card);
}

.tool-seo-content__header {
  display: grid;
  gap: var(--space-2);
  max-width: 760px;
}

.tool-seo-content__eyebrow {
  margin: 0;
  color: var(--color-brand-700);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0;
  text-transform: uppercase;
}

:root[data-theme="dark"] .tool-seo-content__eyebrow {
  color: var(--color-brand-300);
}

.tool-seo-content h2,
.tool-seo-content h3,
.tool-seo-content p,
.tool-seo-content dl,
.tool-seo-content dd {
  margin: 0;
}

.tool-seo-content h2 {
  color: var(--color-text-primary);
  font-family: var(--font-heading);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  line-height: 1.2;
}

.tool-seo-content__header > p:not(.tool-seo-content__eyebrow) {
  color: var(--color-text-secondary);
  font-size: var(--font-size-md);
  line-height: var(--line-height-body-md);
}

.tool-seo-content__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.75fr);
  gap: var(--space-4);
  align-items: start;
}

.tool-seo-content__faq,
.tool-seo-content__side,
.tool-seo-content__cta,
.tool-seo-content__links {
  display: grid;
  gap: var(--space-3);
}

.tool-seo-content__faq,
.tool-seo-content__cta,
.tool-seo-content__links {
  padding: var(--space-4);
  border: 1px solid var(--color-outline-subtle);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
}

.tool-seo-content h3 {
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.tool-seo-content__faq-list {
  display: grid;
  gap: var(--space-3);
}

.tool-seo-content__faq-item {
  display: grid;
  gap: var(--space-1);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-outline-subtle);
}

.tool-seo-content__faq-item:first-child {
  padding-top: 0;
  border-top: 0;
}

.tool-seo-content dt {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-body-sm);
}

.tool-seo-content dd,
.tool-seo-content__cta p,
.tool-seo-content__link span {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-body-md);
}

.tool-seo-content__cta {
  border-color: var(--color-positive-border);
  background: var(--color-positive-bg);
}

.tool-seo-content__cta span {
  color: var(--color-positive-dark);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

:root[data-theme="dark"] .tool-seo-content__cta span {
  color: var(--color-positive);
}

.tool-seo-content__cta-link,
.tool-seo-content__link {
  color: inherit;
  text-decoration: none;
}

.tool-seo-content__cta-link {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: var(--space-1);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  background: var(--color-brand-600);
  color: var(--color-text-on-brand);
  font-weight: var(--font-weight-semibold);
}

.tool-seo-content__link {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-3);
  border: 1px solid var(--color-outline-subtle);
  border-radius: var(--radius-sm);
  background: var(--color-bg-base);
  transition:
    border-color var(--motion-fast),
    transform var(--motion-fast);
}

.tool-seo-content__link:hover,
.tool-seo-content__link:focus-visible {
  border-color: var(--color-brand-500);
  transform: translateY(-1px);
}

.tool-seo-content__link strong {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}

@media (max-width: 860px) {
  .tool-seo-content {
    padding: var(--space-4);
  }

  .tool-seo-content__grid {
    grid-template-columns: 1fr;
  }
}
</style>
