<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 280 200"
    fill="none"
    aria-hidden="true"
    role="presentation"
    v-bind="$attrs"
  >
    <ellipse cx="140" cy="120" rx="120" ry="75" fill="#44d4ff" opacity="0.05" />

    <!-- Target rings -->
    <circle cx="140" cy="100" r="70" fill="#44d4ff" opacity="0.06" stroke="#44d4ff" stroke-width="1.5" stroke-opacity="0.2" />
    <circle cx="140" cy="100" r="52" fill="#44d4ff" opacity="0.08" stroke="#44d4ff" stroke-width="1.5" stroke-opacity="0.28" />
    <circle cx="140" cy="100" r="34" fill="#44d4ff" opacity="0.12" stroke="#44d4ff" stroke-width="1.5" stroke-opacity="0.38" />
    <circle cx="140" cy="100" r="16" fill="#44d4ff" opacity="0.22" />

    <!-- Arrow (missed — slightly off center) -->
    <line x1="210" y1="40" x2="158" y2="92" stroke="#44d4ff" stroke-width="2.5" stroke-linecap="round" stroke-opacity="0.6" />
    <!-- Arrowhead -->
    <path d="M158 92 L148 90 L156 82" fill="none" stroke="#44d4ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.6" />
    <!-- Arrow tail feathers -->
    <path d="M210 40 L218 34 M210 40 L216 48" stroke="#44d4ff" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.45" />

    <!-- Progress bar below -->
    <rect x="76" y="155" width="128" height="10" rx="5" fill="#44d4ff" opacity="0.15" />
    <rect x="76" y="155" width="56" height="10" rx="5" fill="#44d4ff" opacity="0.45" />

    <!-- Label line -->
    <rect x="100" y="172" width="80" height="6" rx="3" fill="#44d4ff" opacity="0.2" />

    <!-- Decorative dots -->
    <circle cx="52" cy="88" r="5" fill="#44d4ff" opacity="0.2" />
    <circle cx="42" cy="108" r="3.5" fill="#44d4ff" opacity="0.15" />
    <circle cx="232" cy="115" r="4" fill="#44d4ff" opacity="0.18" />
  </svg>
</template>
