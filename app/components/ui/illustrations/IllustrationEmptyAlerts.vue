<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 280 200"
    fill="none"
    aria-hidden="true"
    role="presentation"
    v-bind="$attrs"
  >
    <ellipse cx="140" cy="118" rx="118" ry="76" fill="#44d4ff" opacity="0.05" />

    <!-- Bell body -->
    <path
      d="M140 38 C110 38 90 62 90 90 L90 118 L80 132 L200 132 L190 118 L190 90 C190 62 170 38 140 38 Z"
      fill="#44d4ff"
      opacity="0.14"
      stroke="#44d4ff"
      stroke-width="1.5"
      stroke-opacity="0.38"
    />
    <!-- Bell highlight -->
    <path d="M120 60 C116 70 114 82 114 90" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.15" />

    <!-- Clapper -->
    <rect x="124" y="132" width="32" height="12" rx="6" fill="#44d4ff" opacity="0.35" />

    <!-- Bell base line -->
    <line x1="80" y1="132" x2="200" y2="132" stroke="#44d4ff" stroke-width="1.5" stroke-opacity="0.4" />

    <!-- Silent lines (wavy crossed out lines indicating no alerts) -->
    <path d="M56 80 Q64 72 72 80 Q80 88 88 80" stroke="#44d4ff" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.28" fill="none" />
    <path d="M192 80 Q200 72 208 80 Q216 88 224 80" stroke="#44d4ff" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.28" fill="none" />

    <!-- ZZZ (sleeping / no notifications) -->
    <text x="216" y="56" fill="#44d4ff" font-size="10" font-weight="600" font-family="system-ui, sans-serif" opacity="0.45">z</text>
    <text x="224" y="46" fill="#44d4ff" font-size="13" font-weight="600" font-family="system-ui, sans-serif" opacity="0.35">z</text>
    <text x="234" y="35" fill="#44d4ff" font-size="16" font-weight="700" font-family="system-ui, sans-serif" opacity="0.28">z</text>

    <!-- Decorative dots -->
    <circle cx="44" cy="100" r="5" fill="#44d4ff" opacity="0.2" />
    <circle cx="36" cy="120" r="3.5" fill="#44d4ff" opacity="0.15" />
  </svg>
</template>
