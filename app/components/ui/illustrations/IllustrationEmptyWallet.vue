<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 280 200"
    fill="none"
    aria-hidden="true"
    role="presentation"
    v-bind="$attrs"
  >
    <ellipse cx="140" cy="120" rx="120" ry="76" fill="#44d4ff" opacity="0.05" />

    <!-- Wallet body -->
    <rect x="60" y="60" width="160" height="110" rx="12" fill="#44d4ff" opacity="0.12" stroke="#44d4ff" stroke-width="1.5" stroke-opacity="0.35" />

    <!-- Wallet flap -->
    <rect x="60" y="60" width="160" height="38" rx="12" fill="#44d4ff" opacity="0.18" />
    <line x1="60" y1="98" x2="220" y2="98" stroke="#44d4ff" stroke-width="1" stroke-opacity="0.3" />

    <!-- Coin pocket -->
    <rect x="154" y="108" width="50" height="40" rx="8" fill="#44d4ff" opacity="0.22" stroke="#44d4ff" stroke-width="1.2" stroke-opacity="0.4" />

    <!-- Coin pocket circle -->
    <circle cx="179" cy="128" r="12" fill="#44d4ff" opacity="0.35" />

    <!-- Card slots -->
    <rect x="76" y="112" width="66" height="10" rx="5" fill="#44d4ff" opacity="0.22" />
    <rect x="76" y="128" width="50" height="8" rx="4" fill="#44d4ff" opacity="0.16" />

    <!-- Empty label — dashed outline card -->
    <rect x="76" y="144" width="66" height="18" rx="5" stroke="#44d4ff" stroke-width="1.2" stroke-dasharray="5 3" stroke-opacity="0.4" />

    <!-- Decorative dots -->
    <circle cx="44" cy="80" r="5" fill="#44d4ff" opacity="0.2" />
    <circle cx="36" cy="100" r="3.5" fill="#44d4ff" opacity="0.15" />
    <circle cx="238" cy="95" r="4" fill="#44d4ff" opacity="0.18" />
    <circle cx="245" cy="115" r="3" fill="#44d4ff" opacity="0.14" />
  </svg>
</template>
