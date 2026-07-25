<script setup lang="ts">
import { computed } from "vue";
import { LANDING_FOOTER_LINKS } from "../model/landing-content";

const currentYear = computed<number>(() => new Date().getFullYear());
</script>

<template>
  <footer class="landing-footer" data-testid="landing-footer">
    <div class="landing-footer__inner">
      <div class="landing-footer__brand">
        <span class="landing-footer__brand-mark" aria-hidden="true">A</span>
        <div>
          <strong>Auraxis</strong>
          <span>Planner financeiro inteligente</span>
        </div>
      </div>

      <nav class="landing-footer__links" aria-label="Links legais e de suporte">
        <a
          v-for="link in LANDING_FOOTER_LINKS"
          :key="link.href"
          :href="link.href"
          class="landing-footer__link"
        >
          {{ link.label }}
        </a>
      </nav>

      <p class="landing-footer__copyright">&copy; {{ currentYear }} Auraxis</p>
    </div>
  </footer>
</template>

<style scoped>
.landing-footer {
  border-top: 1px solid var(--landing-line-soft);
  background: var(--landing-bg);
}

.landing-footer__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-4);
  width: min(1120px, calc(100% - 40px));
  margin-inline: auto;
  padding-block: var(--space-6);
}

.landing-footer__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
}

.landing-footer__brand-mark {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm);
  background: var(--landing-grad);
  color: var(--landing-cyan-ink);
  font-family: var(--font-heading);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-extrabold);
}

.landing-footer__brand div {
  display: grid;
  gap: 2px;
}

.landing-footer__brand strong {
  color: var(--landing-ink);
  font-size: var(--landing-size-sm);
  font-weight: var(--font-weight-bold);
}

.landing-footer__brand span {
  color: var(--landing-muted);
  font-size: var(--landing-size-fine);
}

.landing-footer__links {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.landing-footer__link {
  color: var(--landing-muted);
  font-size: var(--landing-size-sm);
  text-decoration: none;
  transition: color var(--motion-fast);
}

.landing-footer__link:hover,
.landing-footer__link:focus-visible {
  color: var(--landing-ink);
}

.landing-footer__link:focus-visible {
  outline: 3px solid var(--landing-glow-cyan);
  outline-offset: 3px;
  border-radius: var(--radius-xs);
}

.landing-footer__copyright {
  margin: 0;
  color: var(--landing-muted);
  font-family: var(--font-mono);
  font-size: var(--landing-size-fine);
}

@media (max-width: 640px) {
  .landing-footer__inner {
    width: min(1120px, calc(100% - 24px));
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
