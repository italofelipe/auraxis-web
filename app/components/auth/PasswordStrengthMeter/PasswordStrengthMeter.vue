<script setup lang="ts">
import { CheckCircle2, Circle } from "lucide-vue-next";

interface Props {
  /** The current password string to evaluate. */
  password: string;
}

const { t } = useI18n();
const props = defineProps<Props>();

// ── Criteria ─────────────────────────────────────────────────────────────────

type Criterion = {
  key: string;
  label: string;
  test: (pw: string) => boolean;
};

const criteria = computed((): Criterion[] => [
  {
    key: "length",
    label: t("auth.password.strength.length"),
    test: (pw) => pw.length >= 10,
  },
  {
    key: "uppercase",
    label: t("auth.password.strength.uppercase"),
    test: (pw) => /[A-Z]/.test(pw),
  },
  {
    key: "number",
    label: t("auth.password.strength.number"),
    test: (pw) => /\d/.test(pw),
  },
  {
    key: "special",
    label: t("auth.password.strength.special"),
    test: (pw) => /[^A-Za-z0-9]/.test(pw),
  },
]);

// ── Strength score ────────────────────────────────────────────────────────────

const score = computed((): number => {
  if (!props.password) { return 0; }
  return criteria.value.filter((c) => c.test(props.password)).length;
});

/**
 * Color class for each bar segment based on the current score.
 *
 * @param index - Zero-based segment index (0–3).
 * @returns CSS class string.
 */
const segmentClass = (index: number): string => {
  if (index >= score.value) { return "strength-meter__segment--empty"; }
  if (score.value <= 1) { return "strength-meter__segment--weak"; }
  if (score.value === 2) { return "strength-meter__segment--fair"; }
  if (score.value === 3) { return "strength-meter__segment--good"; }
  return "strength-meter__segment--strong";
};

const strengthLabel = computed((): string => {
  if (!props.password) { return ""; }
  const labels = [
    t("auth.password.strength.level.weak"),
    t("auth.password.strength.level.weak"),
    t("auth.password.strength.level.fair"),
    t("auth.password.strength.level.good"),
    t("auth.password.strength.level.strong"),
  ];
  return labels[score.value] ?? "";
});

const strengthLabelClass = computed((): string => {
  if (score.value <= 1) { return "strength-meter__label--weak"; }
  if (score.value === 2) { return "strength-meter__label--fair"; }
  if (score.value === 3) { return "strength-meter__label--good"; }
  return "strength-meter__label--strong";
});
</script>

<template>
  <div v-if="password.length > 0" class="strength-meter" aria-label="Força da senha" role="status">
    <!-- ── Bar ──────────────────────────────────────────────────────────── -->
    <div class="strength-meter__bar-row">
      <div class="strength-meter__bar" aria-hidden="true">
        <span
          v-for="i in 4"
          :key="i"
          class="strength-meter__segment"
          :class="segmentClass(i - 1)"
        />
      </div>
      <span
        v-if="strengthLabel"
        class="strength-meter__label"
        :class="strengthLabelClass"
      >
        {{ strengthLabel }}
      </span>
    </div>

    <!-- ── Criteria checklist ─────────────────────────────────────────── -->
    <ul class="strength-meter__criteria" aria-label="Requisitos da senha">
      <li
        v-for="criterion in criteria"
        :key="criterion.key"
        class="strength-meter__criterion"
        :class="{ 'strength-meter__criterion--met': criterion.test(password) }"
      >
        <CheckCircle2
          v-if="criterion.test(password)"
          class="strength-meter__criterion-icon strength-meter__criterion-icon--met"
          :size="13"
          aria-hidden="true"
        />
        <Circle
          v-else
          class="strength-meter__criterion-icon strength-meter__criterion-icon--unmet"
          :size="13"
          aria-hidden="true"
        />
        <span>{{ criterion.label }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.strength-meter {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
}

/* ── Bar ────────────────────────────────────────────────────────────────── */
.strength-meter__bar-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.strength-meter__bar {
  flex: 1;
  display: flex;
  gap: 4px;
  height: 5px;
}

.strength-meter__segment {
  flex: 1;
  border-radius: var(--radius-full);
  transition: background 0.25s ease;
}

.strength-meter__segment--empty {
  background: var(--color-outline-soft);
}

.strength-meter__segment--weak {
  background: var(--color-negative);
}

.strength-meter__segment--fair {
  background: #f59e0b;
}

.strength-meter__segment--good {
  background: #eab308;
}

.strength-meter__segment--strong {
  background: var(--color-positive);
}

.strength-meter__label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  flex-shrink: 0;
  transition: color 0.25s ease;
}

.strength-meter__label--weak  { color: var(--color-negative); }
.strength-meter__label--fair  { color: #f59e0b; }
.strength-meter__label--good  { color: #eab308; }
.strength-meter__label--strong { color: var(--color-positive); }

/* ── Criteria list ──────────────────────────────────────────────────────── */
.strength-meter__criteria {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px var(--space-3);
}

.strength-meter__criterion {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  transition: color 0.2s ease;
}

.strength-meter__criterion--met {
  color: var(--color-positive);
}

.strength-meter__criterion-icon--met {
  color: var(--color-positive);
}

.strength-meter__criterion-icon--unmet {
  color: var(--color-outline-soft);
}
</style>
