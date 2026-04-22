<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 280 200"
    fill="none"
    aria-hidden="true"
    role="presentation"
    v-bind="$attrs"
  >
    <ellipse cx="140" cy="120" rx="120" ry="80" fill="#44d4ff" opacity="0.05" />

    <!-- Receipt body -->
    <rect x="80" y="40" width="120" height="130" rx="8" fill="#44d4ff" opacity="0.12" />
    <rect x="80" y="40" width="120" height="130" rx="8" stroke="#44d4ff" stroke-width="1.5" stroke-opacity="0.4" />

    <!-- Zigzag bottom of receipt -->
    <path d="M80 160 L90 170 L100 160 L110 170 L120 160 L130 170 L140 160 L150 170 L160 160 L170 170 L180 160 L190 170 L200 160" stroke="#44d4ff" stroke-width="1.5" stroke-opacity="0.4" fill="none" />

    <!-- Line items -->
    <rect x="96" y="64" width="88" height="8" rx="4" fill="#44d4ff" opacity="0.35" />
    <rect x="96" y="80" width="60" height="6" rx="3" fill="#44d4ff" opacity="0.22" />
    <rect x="96" y="94" width="72" height="6" rx="3" fill="#44d4ff" opacity="0.22" />
    <rect x="96" y="108" width="50" height="6" rx="3" fill="#44d4ff" opacity="0.22" />

    <!-- Divider -->
    <line x1="96" y1="122" x2="184" y2="122" stroke="#44d4ff" stroke-width="1" stroke-opacity="0.3" />

    <!-- Total row -->
    <rect x="96" y="130" width="44" height="7" rx="3" fill="#44d4ff" opacity="0.28" />
    <rect x="152" y="130" width="32" height="7" rx="3" fill="#44d4ff" opacity="0.45" />

    <!-- Empty magnifier -->
    <circle cx="200" cy="60" r="22" fill="#44d4ff" opacity="0.1" stroke="#44d4ff" stroke-width="1.5" stroke-opacity="0.5" />
    <line x1="216" y1="76" x2="228" y2="88" stroke="#44d4ff" stroke-width="2.5" stroke-linecap="round" stroke-opacity="0.55" />

    <!-- Question mark inside magnifier -->
    <text x="200" y="67" text-anchor="middle" fill="#44d4ff" font-size="18" font-weight="700" font-family="system-ui, sans-serif" opacity="0.6">?</text>

    <!-- Decorative dots -->
    <circle cx="58" cy="70" r="5" fill="#44d4ff" opacity="0.22" />
    <circle cx="48" cy="90" r="3.5" fill="#44d4ff" opacity="0.16" />
    <circle cx="230" cy="130" r="4" fill="#44d4ff" opacity="0.2" />
  </svg>
</template>
