<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "#app";
import { useI18n } from "vue-i18n";
import {
  Menu,
  X,
  ChevronDown,
} from "lucide-vue-next";
import { TOOLS_CATALOG } from "~/features/tools/model/tools-catalog";

const { t } = useI18n();
const route = useRoute();

/**
 * Groups of tools in the sidebar, keyed by category slug.
 * Categories are inferred from the catalog tool IDs.
 */
interface ToolGroup {
  label: string;
  tools: Array<{ id: string; name: string; route: string; enabled: boolean }>;
}

/**
 * Static grouping definitions — each entry maps a group label to a set of tool IDs.
 * Order determines display order in the sidebar.
 */
const GROUP_DEFINITIONS: Array<{ labelKey: string; ids: string[] }> = [
  {
    labelKey: "toolsSidebar.groups.labor",
    ids: ["thirteenth-salary", "hora-extra", "ferias", "rescisao", "fgts", "clt-vs-pj"],
  },
  {
    labelKey: "toolsSidebar.groups.tax",
    ids: ["inss-ir-folha", "mei"],
  },
  {
    labelKey: "toolsSidebar.groups.investment",
    ids: ["cdb-lci-lca", "tesouro-direto", "juros-compostos", "fii", "aposentadoria", "fire"],
  },
  {
    labelKey: "toolsSidebar.groups.realEstate",
    ids: ["financiamento-imobiliario", "aluguel-vs-compra"],
  },
  {
    labelKey: "toolsSidebar.groups.personal",
    ids: ["installment-vs-cash", "dividir-conta", "desconto-markup", "conversor-moeda"],
  },
];

const toolsById = computed(() => {
  const map = new Map<string, (typeof TOOLS_CATALOG)[number]>();
  for (const tool of TOOLS_CATALOG) {
    map.set(tool.id, tool);
  }
  return map;
});

const toolGroups = computed<ToolGroup[]>(() =>
  GROUP_DEFINITIONS.map((group) => ({
    label: t(group.labelKey),
    tools: group.ids
      .map((id) => toolsById.value.get(id))
      .filter((tool): tool is (typeof TOOLS_CATALOG)[number] => tool !== undefined)
      .map((tool) => ({
        id: tool.id,
        name: tool.name,
        route: tool.route,
        enabled: tool.enabled,
      })),
  })).filter((group) => group.tools.length > 0),
);

const currentPath = computed<string>(() => String(route.path ?? ""));

/**
 * Returns true if the given route is the currently active tool page.
 * @param toolRoute - The route path to check against the current page.
 * @returns True if the current page matches the given route.
 */
const isActive = (toolRoute: string): boolean =>
  currentPath.value === toolRoute || currentPath.value.startsWith(toolRoute + "/");

/** Controls mobile drawer visibility. */
const isMobileOpen = ref(false);

/** Toggles the mobile drawer open/closed. */
const toggleMobile = (): void => {
  isMobileOpen.value = !isMobileOpen.value;
};

/** Closes the mobile drawer. */
const closeMobile = (): void => {
  isMobileOpen.value = false;
};

/** Which groups are expanded on mobile (all open by default). */
const expandedGroups = ref<Set<string>>(
  new Set(GROUP_DEFINITIONS.map((g) => g.labelKey)),
);

/**
 * Toggles the expanded state of a group in the accordion.
 * @param labelKey - The i18n key identifying the group.
 */
const toggleGroup = (labelKey: string): void => {
  if (expandedGroups.value.has(labelKey)) {
    expandedGroups.value.delete(labelKey);
  } else {
    expandedGroups.value.add(labelKey);
  }
};

/**
 * Returns true if the given group is currently expanded.
 * @param labelKey - The i18n key identifying the group.
 * @returns True if the group is expanded.
 */
const isGroupExpanded = (labelKey: string): boolean =>
  expandedGroups.value.has(labelKey);
</script>

<template>
  <!-- ── Mobile toggle ─────────────────────────────────────────────────────────── -->
  <div class="tools-sidebar__mobile-bar" aria-label="tools-sidebar.mobileBar">
    <button
      type="button"
      class="tools-sidebar__mobile-toggle"
      :aria-expanded="isMobileOpen"
      :aria-label="isMobileOpen ? t('toolsSidebar.close') : t('toolsSidebar.open')"
      @click="toggleMobile"
    >
      <component :is="isMobileOpen ? X : Menu" :size="20" aria-hidden="true" />
      <span>{{ t("toolsSidebar.title") }}</span>
    </button>
  </div>

  <!-- ── Backdrop (mobile) ─────────────────────────────────────────────────────── -->
  <div
    v-if="isMobileOpen"
    class="tools-sidebar__backdrop"
    aria-hidden="true"
    @click="closeMobile"
  />

  <!-- ── Sidebar ───────────────────────────────────────────────────────────────── -->
  <nav
    class="tools-sidebar"
    :class="{ 'tools-sidebar--open': isMobileOpen }"
    :aria-label="t('toolsSidebar.navAriaLabel')"
  >
    <div class="tools-sidebar__header">
      <span class="tools-sidebar__header-title">{{ t("toolsSidebar.title") }}</span>
      <button
        type="button"
        class="tools-sidebar__close-btn"
        :aria-label="t('toolsSidebar.close')"
        @click="closeMobile"
      >
        <X :size="18" aria-hidden="true" />
      </button>
    </div>

    <ul class="tools-sidebar__groups" role="list">
      <li
        v-for="group in toolGroups"
        :key="group.label"
        class="tools-sidebar__group"
      >
        <!-- Group heading / accordion trigger -->
        <button
          type="button"
          class="tools-sidebar__group-heading"
          :aria-expanded="isGroupExpanded(GROUP_DEFINITIONS.find(g => t(g.labelKey) === group.label)?.labelKey ?? '')"
          @click="toggleGroup(GROUP_DEFINITIONS.find(g => t(g.labelKey) === group.label)?.labelKey ?? '')"
        >
          <span>{{ group.label }}</span>
          <ChevronDown
            :size="14"
            class="tools-sidebar__group-chevron"
            :class="{
              'tools-sidebar__group-chevron--open': isGroupExpanded(
                GROUP_DEFINITIONS.find(g => t(g.labelKey) === group.label)?.labelKey ?? ''
              )
            }"
            aria-hidden="true"
          />
        </button>

        <!-- Tool links -->
        <ul
          v-show="isGroupExpanded(GROUP_DEFINITIONS.find(g => t(g.labelKey) === group.label)?.labelKey ?? '')"
          class="tools-sidebar__tool-list"
          role="list"
        >
          <li
            v-for="tool in group.tools"
            :key="tool.id"
            class="tools-sidebar__tool-item"
          >
            <NuxtLink
              :to="tool.route"
              class="tools-sidebar__tool-link"
              :class="{
                'tools-sidebar__tool-link--active': isActive(tool.route),
                'tools-sidebar__tool-link--disabled': !tool.enabled,
              }"
              :aria-current="isActive(tool.route) ? 'page' : undefined"
              :aria-disabled="!tool.enabled"
              @click="closeMobile"
            >
              {{ tool.name }}
            </NuxtLink>
          </li>
        </ul>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
/* ── Mobile bar ──────────────────────────────────────────────────────────────── */
.tools-sidebar__mobile-bar {
  display: none;
  align-items: center;
  padding: var(--space-3, 12px) var(--space-4, 16px);
  border-bottom: 1px solid var(--color-outline-soft);
  background: var(--color-bg-surface);
  position: sticky;
  top: 0;
  z-index: 20;
}

.tools-sidebar__mobile-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-body-sm, 14px);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--color-text-primary);
  padding: 0;
}

/* ── Backdrop ────────────────────────────────────────────────────────────────── */
.tools-sidebar__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 30;
}

/* ── Sidebar ─────────────────────────────────────────────────────────────────── */
.tools-sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--color-bg-surface);
  border-right: 1px solid var(--color-outline-soft);
  overflow-y: auto;
  position: sticky;
  top: 0;
  height: 100%;
  max-height: calc(100vh - var(--public-header-height, 64px));
}

/* ── Header ──────────────────────────────────────────────────────────────────── */
.tools-sidebar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4, 16px) var(--space-4, 16px) var(--space-2, 8px);
  border-bottom: 1px solid var(--color-outline-soft);
}

.tools-sidebar__header-title {
  font-size: var(--font-size-body-xs, 12px);
  font-weight: var(--font-weight-semibold, 600);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
}

.tools-sidebar__close-btn {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 4px;
  border-radius: var(--radius-sm, 4px);
  line-height: 1;
}

/* ── Groups ──────────────────────────────────────────────────────────────────── */
.tools-sidebar__groups {
  list-style: none;
  margin: 0;
  padding: var(--space-2, 8px) 0;
}

.tools-sidebar__group {
  margin-bottom: var(--space-1, 4px);
}

.tools-sidebar__group-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-2, 8px) var(--space-4, 16px);
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-body-xs, 12px);
  font-weight: var(--font-weight-semibold, 600);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  text-align: left;
  transition: color 0.15s;
}

.tools-sidebar__group-heading:hover {
  color: var(--color-text-secondary);
}

.tools-sidebar__group-chevron {
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.tools-sidebar__group-chevron--open {
  transform: rotate(180deg);
}

/* ── Tool list ───────────────────────────────────────────────────────────────── */
.tools-sidebar__tool-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.tools-sidebar__tool-item {
  display: block;
}

.tools-sidebar__tool-link {
  display: block;
  padding: var(--space-2, 8px) var(--space-4, 16px) var(--space-2, 8px) calc(var(--space-4, 16px) + 8px);
  font-size: var(--font-size-body-sm, 14px);
  color: var(--color-text-secondary);
  text-decoration: none;
  border-left: 2px solid transparent;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
  border-radius: 0 var(--radius-sm, 4px) var(--radius-sm, 4px) 0;
}

.tools-sidebar__tool-link:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-elevated);
}

.tools-sidebar__tool-link:focus-visible {
  outline: 2px solid var(--color-brand-600);
  outline-offset: -2px;
}

.tools-sidebar__tool-link--active {
  color: var(--color-brand-600);
  background: var(--color-brand-50, rgba(59, 130, 246, 0.08));
  border-left-color: var(--color-brand-600);
  font-weight: var(--font-weight-semibold, 600);
}

.tools-sidebar__tool-link--disabled {
  color: var(--color-text-muted);
  pointer-events: none;
  opacity: 0.5;
}

/* ── Responsive ──────────────────────────────────────────────────────────────── */
@media (max-width: 767px) {
  .tools-sidebar__mobile-bar {
    display: flex;
  }

  .tools-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 280px;
    max-height: 100dvh;
    z-index: 40;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    box-shadow: none;
  }

  .tools-sidebar--open {
    transform: translateX(0);
    box-shadow: var(--shadow-lg, 0 4px 24px rgba(0, 0, 0, 0.16));
  }

  .tools-sidebar__close-btn {
    display: flex;
  }
}
</style>
