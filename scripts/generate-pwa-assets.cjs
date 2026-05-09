const { execFileSync } = require("node:child_process");
const { mkdirSync, mkdtempSync, rmSync, writeFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");

const root = process.cwd();
const tmp = mkdtempSync(join(tmpdir(), "auraxis-pwa-"));

mkdirSync(join(root, "public/screenshots"), { recursive: true });

const convertSvg = (svg, outputPath) => {
  const input = join(tmp, `${outputPath.replace(/[^a-z0-9]/gi, "-")}.svg`);
  writeFileSync(input, svg);
  execFileSync("sips", ["-s", "format", "png", input, "--out", outputPath], {
    stdio: "ignore",
  });
};

const dashboardSvg = (width, height, title, subtitle) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#06141f"/>
  <rect x="${width * 0.06}" y="${height * 0.08}" width="${width * 0.88}" height="${height * 0.84}" rx="28" fill="#0d2534"/>
  <rect x="${width * 0.09}" y="${height * 0.12}" width="${width * 0.08}" height="${height * 0.14}" rx="18" fill="#44d4ff"/>
  <text x="${width * 0.13}" y="${height * 0.22}" font-family="Georgia, serif" font-size="${height * 0.09}" font-weight="700" text-anchor="middle" fill="#06141f">A</text>
  <text x="${width * 0.2}" y="${height * 0.18}" font-family="Inter, Arial, sans-serif" font-size="${height * 0.052}" font-weight="800" fill="#eef8ff">${title}</text>
  <text x="${width * 0.2}" y="${height * 0.25}" font-family="Inter, Arial, sans-serif" font-size="${height * 0.027}" fill="#b6c9d6">${subtitle}</text>
  <rect x="${width * 0.09}" y="${height * 0.34}" width="${width * 0.24}" height="${height * 0.2}" rx="18" fill="#102f42"/>
  <rect x="${width * 0.38}" y="${height * 0.34}" width="${width * 0.24}" height="${height * 0.2}" rx="18" fill="#102f42"/>
  <rect x="${width * 0.67}" y="${height * 0.34}" width="${width * 0.18}" height="${height * 0.2}" rx="18" fill="#102f42"/>
  <text x="${width * 0.12}" y="${height * 0.42}" font-family="Inter, Arial, sans-serif" font-size="${height * 0.028}" fill="#b6c9d6">Saldo</text>
  <text x="${width * 0.12}" y="${height * 0.49}" font-family="Inter, Arial, sans-serif" font-size="${height * 0.05}" font-weight="800" fill="#eef8ff">R$ 42.500</text>
  <text x="${width * 0.41}" y="${height * 0.42}" font-family="Inter, Arial, sans-serif" font-size="${height * 0.028}" fill="#b6c9d6">Metas</text>
  <text x="${width * 0.41}" y="${height * 0.49}" font-family="Inter, Arial, sans-serif" font-size="${height * 0.05}" font-weight="800" fill="#eef8ff">78%</text>
  <text x="${width * 0.7}" y="${height * 0.42}" font-family="Inter, Arial, sans-serif" font-size="${height * 0.028}" fill="#b6c9d6">Carteira</text>
  <text x="${width * 0.7}" y="${height * 0.49}" font-family="Inter, Arial, sans-serif" font-size="${height * 0.05}" font-weight="800" fill="#eef8ff">+4,2%</text>
  <polyline points="${width * 0.1},${height * 0.78} ${width * 0.23},${height * 0.7} ${width * 0.36},${height * 0.73} ${width * 0.49},${height * 0.62} ${width * 0.62},${height * 0.66} ${width * 0.82},${height * 0.52}" fill="none" stroke="#44d4ff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="${width * 0.09}" y="${height * 0.62}" width="${width * 0.76}" height="${height * 0.2}" rx="18" fill="none" stroke="rgba(68,212,255,0.24)" stroke-width="2"/>
</svg>`;

const icons = [
  ["public/icons/icon-192.svg", "public/icons/icon-192.png"],
  ["public/icons/icon-512.svg", "public/icons/icon-512.png"],
  ["public/icons/icon-maskable-512.svg", "public/icons/icon-maskable-512.png"],
  ["public/icons/icon-192.svg", "public/apple-touch-icon.png"],
];

for (const [input, output] of icons) {
  execFileSync("sips", ["-s", "format", "png", join(root, input), "--out", join(root, output)], {
    stdio: "ignore",
  });
}

convertSvg(
  dashboardSvg(1280, 720, "Auraxis Dashboard", "Visao consolidada de metas, carteira e fluxo financeiro"),
  join(root, "public/screenshots/pwa-dashboard-wide.png"),
);
convertSvg(
  dashboardSvg(390, 844, "Auraxis", "Planner financeiro no bolso"),
  join(root, "public/screenshots/pwa-dashboard-mobile.png"),
);

rmSync(tmp, { recursive: true, force: true });
