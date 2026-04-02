<!--
  IllustrationMailSent
  ─────────────────────────────────────────────────────────────────────────────
  Undraw-inspired flat SVG illustration for the "email sent / forgot-password
  success" state. Uses the Auraxis brand amber (#ffbe4d) as the primary accent.

  Usage:
    <IllustrationMailSent class="my-4" style="max-width: 280px" />

  Notes:
  - Fully responsive via viewBox; no fixed width/height on the element.
  - All shapes are purely decorative (aria-hidden on the <svg>).
  - Works in both light and dark themes — envelope body uses currentColor with
    opacity so it inherits the nearest color context.
-->
<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 400 300"
    fill="none"
    aria-hidden="true"
    role="presentation"
    v-bind="$attrs"
  >
    <!-- Ambient glow -->
    <ellipse cx="200" cy="165" rx="185" ry="135" fill="#ffbe4d" opacity="0.06" />

    <!-- ── Envelope ───────────────────────────────────────────────────── -->
    <!-- Shadow -->
    <rect x="73" y="122" width="266" height="158" rx="14" fill="#000" opacity="0.12" />
    <!-- Body -->
    <rect x="68" y="116" width="266" height="158" rx="14" fill="currentColor" opacity="0.07" />
    <rect x="68" y="116" width="266" height="158" rx="14" stroke="#ffbe4d" stroke-width="2" stroke-opacity="0.55" />
    <!-- Inner content lines (simulated letter) -->
    <line x1="115" y1="185" x2="287" y2="185" stroke="#ffbe4d" stroke-width="2" stroke-opacity="0.18" stroke-linecap="round" />
    <line x1="115" y1="207" x2="258" y2="207" stroke="#ffbe4d" stroke-width="2" stroke-opacity="0.12" stroke-linecap="round" />
    <line x1="115" y1="229" x2="230" y2="229" stroke="#ffbe4d" stroke-width="2" stroke-opacity="0.08" stroke-linecap="round" />
    <!-- Flap fold (V from top-left → centre → top-right) -->
    <path d="M68 116 L201 202 L334 116" stroke="#ffbe4d" stroke-width="2" stroke-opacity="0.45" fill="none" />
    <!-- Bottom corner folds -->
    <path d="M68 274 L148 222" stroke="#ffbe4d" stroke-width="1.5" stroke-opacity="0.22" stroke-linecap="round" />
    <path d="M334 274 L254 222" stroke="#ffbe4d" stroke-width="1.5" stroke-opacity="0.22" stroke-linecap="round" />

    <!-- ── Success badge ──────────────────────────────────────────────── -->
    <!-- Halo -->
    <circle cx="314" cy="80" r="48" fill="#ffbe4d" opacity="0.15" />
    <!-- Main circle -->
    <circle cx="314" cy="80" r="38" fill="#ffbe4d" />
    <!-- Checkmark -->
    <path d="M296 80 L310 94 L334 67" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />

    <!-- ── Motion trail (dots from envelope toward badge) ──────────────── -->
    <circle cx="262" cy="52" r="3.5" fill="#ffbe4d" opacity="0.45" />
    <circle cx="278" cy="43" r="2.5" fill="#ffbe4d" opacity="0.3" />
    <circle cx="293" cy="36" r="2" fill="#ffbe4d" opacity="0.2" />

    <!-- ── Decorative cluster — top-left ─────────────────────────────── -->
    <circle cx="92" cy="72" r="7" fill="#ffbe4d" opacity="0.32" />
    <circle cx="116" cy="52" r="5" fill="#ffbe4d" opacity="0.22" />
    <circle cx="74" cy="56" r="5" fill="#ffbe4d" opacity="0.17" />
    <circle cx="104" cy="38" r="3.5" fill="#ffbe4d" opacity="0.12" />

    <!-- ── Decorative cluster — right ────────────────────────────────── -->
    <circle cx="366" cy="152" r="5" fill="#ffbe4d" opacity="0.28" />
    <circle cx="378" cy="174" r="3.5" fill="#ffbe4d" opacity="0.2" />
    <circle cx="358" cy="170" r="4" fill="#ffbe4d" opacity="0.22" />

    <!-- ── Sparkle — bottom-left ─────────────────────────────────────── -->
    <path
      d="M38 234 L41 227 L44 234 L51 231 L44 238 L41 245 L38 238 L31 231 Z"
      fill="#ffbe4d"
      opacity="0.32"
    />

    <!-- ── Star — top-right ───────────────────────────────────────────── -->
    <path
      d="M364 46 L366.3 40 L368.5 46 L374.5 46 L369.8 49.5 L371.8 55.5 L366 52 L360.2 55.5 L362.2 49.5 L357.5 46 Z"
      fill="#ffbe4d"
      opacity="0.38"
    />
  </svg>
</template>
