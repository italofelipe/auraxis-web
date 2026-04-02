<!--
  IllustrationFinanceGrowth
  ─────────────────────────────────────────────────────────────────────────────
  Undraw-inspired flat SVG illustration for financial growth / tool CTA
  sections. Shows an ascending bar chart with a coin and trend arrow.

  Usage:
    <IllustrationFinanceGrowth class="my-4" style="max-width: 320px" />

  Notes:
  - Fully responsive via viewBox; no fixed width/height on the element.
  - All shapes are purely decorative (aria-hidden on the <svg>).
  - Works in both light and dark themes.
-->
<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 420 320"
    fill="none"
    aria-hidden="true"
    role="presentation"
    v-bind="$attrs"
  >
    <!-- Ambient glow -->
    <ellipse cx="210" cy="180" rx="195" ry="145" fill="#ffbe4d" opacity="0.05" />

    <!-- ── Ground line ─────────────────────────────────────────────────── -->
    <line x1="48" y1="268" x2="330" y2="268" stroke="#ffbe4d" stroke-width="2" stroke-opacity="0.28" stroke-linecap="round" />

    <!-- ── Bars (ascending left→right) ──────────────────────────────── -->
    <!-- Bar 1 -->
    <rect x="68" y="210" width="56" height="58" rx="7" fill="#ffbe4d" opacity="0.28" />
    <rect x="68" y="213" width="56" height="55" rx="7" fill="#ffbe4d" opacity="0.42" />
    <!-- Bar 2 -->
    <rect x="148" y="155" width="56" height="113" rx="7" fill="#ffbe4d" opacity="0.42" />
    <rect x="148" y="158" width="56" height="110" rx="7" fill="#ffbe4d" opacity="0.62" />
    <!-- Bar 3 -->
    <rect x="228" y="96" width="56" height="172" rx="7" fill="#ffbe4d" opacity="0.58" />
    <rect x="228" y="99" width="56" height="169" rx="7" fill="#ffbe4d" opacity="0.85" />

    <!-- Bar top highlights -->
    <rect x="70" y="213" width="52" height="10" rx="5" fill="white" opacity="0.12" />
    <rect x="150" y="158" width="52" height="10" rx="5" fill="white" opacity="0.12" />
    <rect x="230" y="99" width="52" height="10" rx="5" fill="white" opacity="0.14" />

    <!-- ── Trend line & arrow ─────────────────────────────────────────── -->
    <path
      d="M96 210 L176 156 L256 97"
      stroke="#ffbe4d"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-dasharray="7 5"
      opacity="0.75"
    />
    <!-- Arrowhead -->
    <path d="M256 97 L265 106 M256 97 L247 106" stroke="#ffbe4d" stroke-width="2.5" stroke-linecap="round" opacity="0.9" />

    <!-- ── Coin ────────────────────────────────────────────────────────── -->
    <!-- Outer ring -->
    <circle cx="356" cy="168" r="40" fill="#ffbe4d" opacity="0.15" />
    <!-- Coin body -->
    <circle cx="356" cy="168" r="32" fill="#ffbe4d" />
    <!-- Inner ring -->
    <circle cx="356" cy="168" r="27" fill="#ffbe4d" stroke="white" stroke-width="2" stroke-opacity="0.3" />
    <!-- Dollar sign -->
    <text
      x="356"
      y="177"
      text-anchor="middle"
      fill="white"
      font-size="24"
      font-weight="700"
      font-family="system-ui, sans-serif"
      opacity="0.95"
    >$</text>

    <!-- ── Decorative dots — left ─────────────────────────────────────── -->
    <circle cx="36" cy="148" r="6" fill="#ffbe4d" opacity="0.28" />
    <circle cx="56" cy="128" r="4" fill="#ffbe4d" opacity="0.2" />
    <circle cx="30" cy="124" r="4.5" fill="#ffbe4d" opacity="0.16" />

    <!-- ── Decorative dots — top right ───────────────────────────────── -->
    <circle cx="390" cy="108" r="5" fill="#ffbe4d" opacity="0.24" />
    <circle cx="404" cy="128" r="3.5" fill="#ffbe4d" opacity="0.18" />
    <circle cx="384" cy="130" r="4" fill="#ffbe4d" opacity="0.2" />

    <!-- ── Sparkle — top center ──────────────────────────────────────── -->
    <path
      d="M180 44 L182.5 38 L185 44 L191 44 L186.5 47.5 L188.5 53.5 L182.5 50 L176.5 53.5 L178.5 47.5 L174 44 Z"
      fill="#ffbe4d"
      opacity="0.42"
    />

    <!-- ── Sparkle — bottom right ────────────────────────────────────── -->
    <path
      d="M308 276 L310 271 L312 276 L317 276 L313 279 L315 284 L310 281 L305 284 L307 279 L303 276 Z"
      fill="#ffbe4d"
      opacity="0.3"
    />

    <!-- ── Small floating coin shadow ────────────────────────────────── -->
    <ellipse cx="356" cy="210" rx="22" ry="5" fill="#000" opacity="0.1" />
  </svg>
</template>
