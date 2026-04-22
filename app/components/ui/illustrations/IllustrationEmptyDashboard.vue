<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 280 200"
    fill="none"
    aria-hidden="true"
    role="presentation"
    v-bind="$attrs"
  >
    <ellipse cx="140" cy="120" rx="120" ry="78" fill="#44d4ff" opacity="0.05" />

    <!-- Dashboard grid outline -->
    <rect x="48" y="44" width="184" height="132" rx="10" fill="#44d4ff" opacity="0.08" stroke="#44d4ff" stroke-width="1.5" stroke-opacity="0.28" />

    <!-- Top metric cards (3 empty) -->
    <rect x="58" y="54" width="52" height="36" rx="6" fill="#44d4ff" opacity="0.14" stroke="#44d4ff" stroke-width="1" stroke-opacity="0.25" />
    <rect x="116" y="54" width="52" height="36" rx="6" fill="#44d4ff" opacity="0.14" stroke="#44d4ff" stroke-width="1" stroke-opacity="0.25" />
    <rect x="174" y="54" width="48" height="36" rx="6" fill="#44d4ff" opacity="0.14" stroke="#44d4ff" stroke-width="1" stroke-opacity="0.25" />

    <!-- Card content stubs -->
    <rect x="64" y="62" width="28" height="6" rx="3" fill="#44d4ff" opacity="0.28" />
    <rect x="64" y="73" width="20" height="8" rx="4" fill="#44d4ff" opacity="0.38" />
    <rect x="122" y="62" width="28" height="6" rx="3" fill="#44d4ff" opacity="0.22" />
    <rect x="122" y="73" width="20" height="8" rx="4" fill="#44d4ff" opacity="0.28" />
    <rect x="180" y="62" width="28" height="6" rx="3" fill="#44d4ff" opacity="0.18" />
    <rect x="180" y="73" width="20" height="8" rx="4" fill="#44d4ff" opacity="0.22" />

    <!-- Chart area — flat line (no data) -->
    <rect x="58" y="100" width="110" height="66" rx="6" fill="#44d4ff" opacity="0.1" stroke="#44d4ff" stroke-width="1" stroke-opacity="0.22" />
    <line x1="68" y1="148" x2="158" y2="148" stroke="#44d4ff" stroke-width="1" stroke-opacity="0.25" />
    <path d="M68 138 L88 138 L108 138 L128 138 L148 138" stroke="#44d4ff" stroke-width="2" stroke-linecap="round" stroke-opacity="0.35" stroke-dasharray="5 4" />

    <!-- Small panel right -->
    <rect x="174" y="100" width="48" height="66" rx="6" fill="#44d4ff" opacity="0.1" stroke="#44d4ff" stroke-width="1" stroke-opacity="0.22" />
    <rect x="180" y="110" width="36" height="6" rx="3" fill="#44d4ff" opacity="0.22" />
    <rect x="180" y="122" width="30" height="5" rx="2.5" fill="#44d4ff" opacity="0.16" />
    <rect x="180" y="134" width="32" height="5" rx="2.5" fill="#44d4ff" opacity="0.16" />

    <!-- Decorative dots -->
    <circle cx="32" cy="80" r="5" fill="#44d4ff" opacity="0.2" />
    <circle cx="24" cy="100" r="3.5" fill="#44d4ff" opacity="0.15" />
    <circle cx="252" cy="90" r="4" fill="#44d4ff" opacity="0.18" />
  </svg>
</template>
