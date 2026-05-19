<script setup lang="ts">
import type { LegalDocument } from "~/features/legal/legal-documents";

defineProps<{
  document: LegalDocument;
}>();
</script>

<template>
  <div class="legal-shell">
    <header class="legal-header">
      <span class="legal-brand">Auraxis</span>
      <nav class="legal-nav" aria-label="Navegação legal">
        <NuxtLink to="/login" class="legal-link legal-link--back">Voltar</NuxtLink>
        <NuxtLink
          v-for="link in document.navLinks"
          :key="link.to"
          :to="link.to"
          class="legal-link"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>
    </header>

    <main class="legal-main">
      <article class="legal-article">
        <header class="article-header">
          <p class="article-kicker">Auraxis Legal</p>
          <h1 class="article-title">{{ document.title }}</h1>
          <p class="article-meta">{{ document.versionLabel }} · {{ document.updatedAtLabel }}</p>
          <p class="article-meta">
            Contato:
            <a :href="`mailto:${document.contactEmail}`" class="contact-link">{{ document.contactEmail }}</a>
          </p>
          <p class="article-notice">
            Documento operacional publicado para transparência regulatória e evolução de MVP2. A versão final pode
            receber ajustes após revisão jurídica.
          </p>
        </header>

        <section
          v-for="section in document.sections"
          :key="section.title"
          class="legal-section"
        >
          <h2>{{ section.title }}</h2>

          <p v-for="paragraph in section.paragraphs" :key="paragraph">
            {{ paragraph }}
          </p>

          <ol v-if="section.items?.length">
            <li v-for="item in section.items" :key="item">{{ item }}</li>
          </ol>

          <div
            v-if="section.table"
            class="legal-table-wrap"
            role="region"
            tabindex="0"
            :aria-label="`Tabela: ${section.title}`"
          >
            <table class="legal-table">
              <thead>
                <tr>
                  <th v-for="column in section.table.columns" :key="column" scope="col">
                    {{ column }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in section.table.rows" :key="row.join('|')">
                  <td v-for="cell in row" :key="cell">{{ cell }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <footer class="article-footer">
          <p>
            Dúvidas? Entre em contato:
            <a :href="`mailto:${document.contactEmail}`" class="contact-link">{{ document.contactEmail }}</a>
          </p>
          <nav class="article-footer__links" aria-label="Documentos relacionados">
            <NuxtLink
              v-for="link in document.footerLinks"
              :key="link.to"
              :to="link.to"
              class="inline-link"
            >
              {{ link.label }}
            </NuxtLink>
          </nav>
        </footer>
      </article>
    </main>
  </div>
</template>

<style scoped>
.legal-shell {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--color-brand-400) 10%, transparent), transparent 36rem),
    var(--color-bg-base, #f6f9fb);
}

.legal-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) clamp(var(--space-3), 4vw, var(--space-7));
  border-bottom: 1px solid var(--color-outline-soft, rgba(15, 23, 42, 0.1));
  background: color-mix(in srgb, var(--color-bg-base, #ffffff) 92%, transparent);
  backdrop-filter: blur(12px);
}

.legal-brand {
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-md);
  line-height: var(--line-height-heading-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary, #101828);
}

.legal-nav,
.article-footer__links {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.legal-link,
.inline-link,
.contact-link {
  color: var(--color-brand-700, #087fa7);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
}

.legal-link:hover,
.legal-link:focus,
.inline-link:hover,
.inline-link:focus,
.contact-link:hover,
.contact-link:focus {
  color: var(--color-brand-800, #075f7d);
  text-decoration: underline;
  outline: none;
}

.legal-link--back::before {
  content: "< ";
}

.legal-main {
  flex: 1;
  padding: clamp(var(--space-4), 5vw, var(--space-8)) var(--space-3);
}

.legal-article {
  max-width: 820px;
  margin: 0 auto;
  padding: clamp(var(--space-4), 4vw, var(--space-7));
  border: 1px solid var(--color-outline-soft, rgba(15, 23, 42, 0.1));
  border-radius: var(--radius-lg, 16px);
  background: var(--color-bg-surface, #ffffff);
  box-shadow: 0 18px 60px rgba(15, 23, 42, 0.08);
}

.article-header {
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--color-outline-soft, rgba(15, 23, 42, 0.1));
}

.article-kicker,
.article-meta {
  margin: 0 0 var(--space-1);
  color: var(--color-text-muted, #667085);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-body-sm);
}

.article-kicker {
  color: var(--color-brand-800, #075f7d);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.article-title {
  margin: 0 0 var(--space-2);
  color: var(--color-text-primary, #101828);
  font-family: var(--font-heading);
  font-size: clamp(2rem, 6vw, 3rem);
  line-height: 1.08;
  font-weight: var(--font-weight-bold);
}

.article-notice {
  margin: var(--space-4) 0 0;
  padding: var(--space-3);
  border: 1px solid color-mix(in srgb, var(--color-brand-500, #0ea5e9) 24%, transparent);
  border-radius: var(--radius-md, 12px);
  background: color-mix(in srgb, var(--color-brand-100, #e0f2fe) 52%, transparent);
  color: var(--color-text-secondary, #344054);
}

.legal-section {
  margin-bottom: var(--space-6);
}

.legal-section h2 {
  margin: 0 0 var(--space-3);
  color: var(--color-text-primary, #101828);
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-sm);
  line-height: var(--line-height-heading-sm);
}

.legal-section p,
.legal-section li,
.legal-table {
  color: var(--color-text-secondary, #344054);
  font-size: var(--font-size-body-md);
  line-height: 1.7;
}

.legal-section p {
  margin: 0 0 var(--space-3);
}

.legal-section ol {
  margin: 0;
  padding-left: var(--space-5);
}

.legal-section li + li {
  margin-top: var(--space-2);
}

.legal-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--color-outline-soft, rgba(15, 23, 42, 0.1));
  border-radius: var(--radius-md, 12px);
}

.legal-table {
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;
}

.legal-table th,
.legal-table td {
  padding: var(--space-3);
  border-bottom: 1px solid var(--color-outline-soft, rgba(15, 23, 42, 0.1));
  text-align: left;
  vertical-align: top;
}

.legal-table th {
  color: var(--color-text-primary, #101828);
  background: var(--color-bg-elevated, #f8fafc);
  font-weight: var(--font-weight-bold);
}

.article-footer {
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-outline-soft, rgba(15, 23, 42, 0.1));
}

.article-footer p {
  margin: 0 0 var(--space-3);
  color: var(--color-text-secondary, #344054);
}

@media (max-width: 640px) {
  .legal-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
