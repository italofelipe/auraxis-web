<script setup lang="ts">
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, Clock3 } from "lucide-vue-next";
import { getBlogPost, getRelatedBlogPosts, resolveBlogRobots } from "~/data/blogPosts";

definePageMeta({ layout: "public" });

const route = useRoute();
const config = useRuntimeConfig();
const slugParam = Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug;
const slug = typeof slugParam === "string" ? slugParam : "";
const post = getBlogPost(slug);

if (!post) {
  throw createError({
    statusCode: 404,
    statusMessage: "Post nao encontrado",
  });
}

const siteUrl = String(config.public.siteUrl ?? "https://www.auraxis.com.br").replace(/\/$/, "");
const canonicalUrl = `${siteUrl}/blog/${post.slug}`;
const isMarketingSurface = config.public.siteSurface === "marketing";
const robots = resolveBlogRobots({ isMarketingSurface, routePath: route.path });
const relatedPosts = getRelatedBlogPosts(post.slug);

useSeoMeta({
  title: post.title,
  description: post.description,
  robots,
  ogType: "article",
  ogTitle: post.title,
  ogDescription: post.description,
  ogUrl: canonicalUrl,
  twitterTitle: post.title,
  twitterDescription: post.description,
});

useHead({
  link: [{ rel: "canonical", href: canonicalUrl }],
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: post.description,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt,
        inLanguage: "pt-BR",
        mainEntityOfPage: canonicalUrl,
        author: {
          "@type": "Organization",
          name: "Auraxis",
          url: siteUrl,
        },
        publisher: {
          "@type": "Organization",
          name: "Auraxis",
          url: siteUrl,
        },
        keywords: post.keywords,
      }),
    },
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: post.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }),
    },
  ],
});
</script>

<template>
  <main class="blog-post">
    <article class="blog-post__article">
      <header class="blog-post__hero">
        <div class="blog-post__container blog-post__hero-grid">
          <div class="blog-post__copy motion-fade-up">
            <NuxtLink to="/blog" class="blog-post__back">
              <ArrowLeft :size="16" aria-hidden="true" />
              Voltar ao blog
            </NuxtLink>
            <p class="blog-post__eyebrow">{{ post.heroKicker }}</p>
            <h1>{{ post.title }}</h1>
            <p>{{ post.description }}</p>
            <div class="blog-post__meta" aria-label="Informações do artigo">
              <span>
                <BookOpen :size="16" aria-hidden="true" />
                {{ post.category }}
              </span>
              <span>
                <Clock3 :size="16" aria-hidden="true" />
                {{ post.readingTime }}
              </span>
              <time :datetime="post.updatedAt">
                <CalendarDays :size="16" aria-hidden="true" />
                Atualizado em {{ post.updatedAt }}
              </time>
            </div>
          </div>

          <aside class="blog-post__summary motion-pop" aria-label="Resumo do artigo">
            <h2>O que você vai levar</h2>
            <p>{{ post.excerpt }}</p>
            <ul>
              <li v-for="keyword in post.keywords" :key="keyword">{{ keyword }}</li>
            </ul>
          </aside>
        </div>
      </header>

      <div class="blog-post__container blog-post__body">
        <section v-for="section in post.sections" :key="section.title" class="blog-post__section">
          <h2>{{ section.title }}</h2>
          <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
        </section>

        <section class="blog-post__faq" aria-labelledby="blog-post-faq-title">
          <p class="blog-post__eyebrow">Dúvidas comuns</p>
          <h2 id="blog-post-faq-title">Perguntas frequentes</h2>
          <article v-for="item in post.faq" :key="item.question">
            <h3>{{ item.question }}</h3>
            <p>{{ item.answer }}</p>
          </article>
        </section>

        <section class="blog-post__links" aria-labelledby="blog-post-links-title">
          <div>
            <p class="blog-post__eyebrow">Continue explorando</p>
            <h2 id="blog-post-links-title">Próximos passos úteis</h2>
          </div>
          <nav aria-label="Links relacionados ao artigo">
            <NuxtLink v-for="link in post.relatedLinks" :key="link.to" :to="link.to">
              {{ link.label }}
              <ArrowRight :size="14" aria-hidden="true" />
            </NuxtLink>
          </nav>
        </section>

        <section class="blog-post__related" aria-labelledby="blog-post-related-title">
          <p class="blog-post__eyebrow">Leia também</p>
          <h2 id="blog-post-related-title">Outros guias do Auraxis</h2>
          <div>
            <NuxtLink v-for="item in relatedPosts" :key="item.slug" :to="`/blog/${item.slug}`">
              {{ item.title }}
              <ArrowRight :size="14" aria-hidden="true" />
            </NuxtLink>
          </div>
        </section>
      </div>
    </article>
  </main>
</template>

<style scoped>
.blog-post {
  color: var(--color-text-primary);
  background:
    radial-gradient(
      circle at top left,
      color-mix(in srgb, var(--color-brand-500) 14%, transparent),
      transparent 32rem
    ),
    var(--color-bg-base);
}

.blog-post__container {
  width: min(1000px, calc(100% - 40px));
  margin-inline: auto;
}

.blog-post__hero {
  padding-block: clamp(48px, 7vw, 94px) 42px;
}

.blog-post__hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 0.44fr);
  gap: clamp(28px, 6vw, 64px);
  align-items: end;
}

.blog-post__copy {
  display: grid;
  gap: 18px;
}

.blog-post__back,
.blog-post__links a,
.blog-post__related a {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: var(--color-brand-300);
  font-weight: var(--font-weight-bold);
  text-decoration: none;
}

.blog-post__back {
  justify-self: start;
}

.blog-post__eyebrow {
  margin: 0;
  color: var(--color-brand-400);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.blog-post h1,
.blog-post h2,
.blog-post h3 {
  margin: 0;
  font-family: var(--font-heading);
}

.blog-post h1 {
  max-width: 820px;
  font-size: clamp(2.5rem, 5.6vw, 5rem);
  line-height: 1;
}

.blog-post__copy > p:not(.blog-post__eyebrow) {
  max-width: 760px;
  margin: 0;
  color: var(--color-text-secondary);
  font-size: clamp(1.05rem, 1.8vw, 1.3rem);
  line-height: 1.65;
}

.blog-post__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.blog-post__meta span,
.blog-post__meta time {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-full);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.blog-post__summary,
.blog-post__faq,
.blog-post__links,
.blog-post__related {
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--color-bg-elevated) 82%, transparent);
  box-shadow: var(--shadow-soft);
}

.blog-post__summary {
  display: grid;
  gap: 16px;
  padding: 24px;
}

.blog-post__summary p {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.58;
}

.blog-post__summary ul {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.blog-post__summary li {
  padding: 6px 10px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--color-brand-500) 12%, transparent);
  color: var(--color-brand-300);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
}

.blog-post__body {
  display: grid;
  gap: 32px;
  padding-block: 28px 86px;
}

.blog-post__section {
  max-width: 780px;
}

.blog-post__section h2 {
  margin-bottom: 14px;
  font-size: clamp(1.65rem, 3vw, 2.25rem);
}

.blog-post__section p {
  margin: 0 0 16px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-md);
  line-height: 1.8;
}

.blog-post__faq,
.blog-post__links,
.blog-post__related {
  display: grid;
  gap: 18px;
  padding: clamp(22px, 4vw, 30px);
}

.blog-post__faq article {
  display: grid;
  gap: 8px;
  padding-top: 18px;
  border-top: 1px solid var(--color-outline-soft);
}

.blog-post__faq p {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.65;
}

.blog-post__links nav,
.blog-post__related div {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.blog-post__links a,
.blog-post__related a {
  min-height: 42px;
  padding-inline: 14px;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-sm);
}

@media (max-width: 820px) {
  .blog-post__hero-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .blog-post__container {
    width: min(100% - 28px, 1000px);
  }
}
</style>
