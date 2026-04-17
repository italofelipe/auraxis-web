#!/usr/bin/env node
/**
 * analyze-bundle.cjs
 *
 * Per-chunk bundle-size analyzer used both locally (`pnpm analyze`) and in
 * the CI `bundle-analysis` job. Inspects every asset under
 * `.output/public/_nuxt/`, groups files by file type (JS chunks, CSS, fonts,
 * images, source-maps), and enforces two guards:
 *
 *   1. Total JS gzip across all chunks (catches whole-bundle regressions).
 *   2. Largest single JS chunk gzip (catches a heavy dep landing in one
 *      chunk — the canonical symptom of broken tree-shaking or missing
 *      dynamic import).
 *
 * Nuxt 4 emits hashed chunk names without a stable `vendor-/entry-` prefix,
 * so we do not try to guess vendor vs page semantics. The two guards above
 * reliably catch the regressions #597 cares about without chasing filename
 * conventions.
 *
 * Exit codes:
 *   0 — every guard is under its hard limit
 *   1 — build output missing or any guard exceeded the hard limit
 */

const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const PUBLIC_DIR = path.resolve(__dirname, "..", ".output", "public");
const NUXT_DIR = path.join(PUBLIC_DIR, "_nuxt");
const REPORT_PATH = path.resolve(__dirname, "..", "bundle-report.json");

/**
 * Global guards measured in bytes (gzipped).
 * `warn` prints a non-fatal warning; `hard` fails the process.
 *
 * - `totalJs` — sum of every JS chunk under `.output/public/_nuxt/`.
 *   Default 3 MB hard / 2 MB warn, sized to leave room for a richer
 *   dashboard (ECharts + Naive UI + Vue + Nuxt runtime + app code).
 *
 * - `largestChunk` — gzip size of the single largest JS chunk.
 *   Default 400 KB hard / 250 KB warn. Catches accidental whole-library
 *   imports that land a dep in one non-split chunk.
 */
const GUARDS = {
  totalJs: { warn: 2 * 1024 * 1024, hard: 3 * 1024 * 1024 },
  largestChunk: { warn: 250 * 1024, hard: 400 * 1024 },
};

/**
 * Classifies an asset by file extension.
 *
 * @param {string} filename Chunk basename.
 * @returns {"js"|"css"|"font"|"image"|"map"|"other"}
 */
function classify(filename) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".map")) return "map";
  if (lower.endsWith(".js") || lower.endsWith(".mjs")) return "js";
  if (lower.endsWith(".css")) return "css";
  if (/\.(woff2?|ttf|otf|eot)$/.test(lower)) return "font";
  if (/\.(png|jpe?g|webp|avif|gif|svg|ico)$/.test(lower)) return "image";
  return "other";
}

/**
 * Formats a byte count for human-readable output.
 *
 * @param {number} bytes Size in bytes.
 * @returns {string} Formatted size with unit.
 */
function fmt(bytes) {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * Walks a directory recursively, yielding every file path underneath.
 *
 * @param {string} dir Directory to walk.
 * @returns {string[]} Absolute file paths.
 */
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

/**
 * Picks the status cell for a measured value against a guard.
 *
 * @param {number} value Measured size in bytes.
 * @param {{ warn: number; hard: number }} limit Warn/hard thresholds in bytes.
 * @returns {{ status: "ok" | "warn" | "fail"; label: string }}
 */
function evaluate(value, limit) {
  if (value > limit.hard) return { status: "fail", label: `fail (> ${fmt(limit.hard)})` };
  if (value > limit.warn) return { status: "warn", label: `warn (> ${fmt(limit.warn)})` };
  return { status: "ok", label: "ok" };
}

/**
 * Main entry: walks the build output, prints the Markdown report,
 * writes the JSON artifact, and enforces the configured guards.
 *
 * @returns {{ totals: Record<string, { count: number; raw: number; gzip: number }>; jsChunks: Array<{ file: string; raw: number; gzip: number }>; failed: boolean }}
 */
function analyze() {
  if (!fs.existsSync(NUXT_DIR)) {
    console.error(`bundle analyzer: expected build output at ${NUXT_DIR} — run pnpm build first.`);
    process.exit(1);
  }

  const totals = {
    js: { count: 0, raw: 0, gzip: 0 },
    css: { count: 0, raw: 0, gzip: 0 },
    font: { count: 0, raw: 0, gzip: 0 },
    image: { count: 0, raw: 0, gzip: 0 },
    map: { count: 0, raw: 0, gzip: 0 },
    other: { count: 0, raw: 0, gzip: 0 },
  };
  const jsChunks = [];

  for (const file of walk(NUXT_DIR)) {
    const rel = path.relative(NUXT_DIR, file);
    const kind = classify(rel);
    const raw = fs.statSync(file).size;
    const gzip = kind === "map"
      ? raw
      : zlib.gzipSync(fs.readFileSync(file)).length;
    totals[kind].count += 1;
    totals[kind].raw += raw;
    totals[kind].gzip += gzip;
    if (kind === "js") {
      jsChunks.push({ file: rel, raw, gzip });
    }
  }

  jsChunks.sort((a, b) => b.gzip - a.gzip);

  const totalJsEval = evaluate(totals.js.gzip, GUARDS.totalJs);
  const largest = jsChunks[0];
  const largestEval = largest ? evaluate(largest.gzip, GUARDS.largestChunk) : { status: "ok", label: "ok" };

  const lines = [];
  lines.push("## Per-chunk bundle report");
  lines.push("");
  lines.push("| Type | Files | Raw | Gzip |");
  lines.push("|:-----|------:|----:|-----:|");
  for (const [name, stats] of Object.entries(totals)) {
    if (stats.count === 0) continue;
    lines.push(`| ${name} | ${stats.count} | ${fmt(stats.raw)} | ${fmt(stats.gzip)} |`);
  }
  lines.push("");
  lines.push("### Guards");
  lines.push("");
  lines.push("| Guard | Value | Warn | Hard | Status |");
  lines.push("|:------|------:|-----:|-----:|:-------|");
  lines.push(
    `| Total JS (gzip) | ${fmt(totals.js.gzip)} | ${fmt(GUARDS.totalJs.warn)} | ${fmt(GUARDS.totalJs.hard)} | ${totalJsEval.label} |`,
  );
  lines.push(
    `| Largest single chunk | ${largest ? fmt(largest.gzip) : "n/a"} | ${fmt(GUARDS.largestChunk.warn)} | ${fmt(GUARDS.largestChunk.hard)} | ${largestEval.label} |`,
  );
  lines.push("");
  lines.push("### Top 10 JS chunks by gzip size");
  lines.push("");
  lines.push("| File | Raw | Gzip |");
  lines.push("|:-----|----:|-----:|");
  for (const chunk of jsChunks.slice(0, 10)) {
    lines.push(`| \`${chunk.file}\` | ${fmt(chunk.raw)} | ${fmt(chunk.gzip)} |`);
  }

  const markdown = lines.join("\n");
  console.log(markdown);

  fs.writeFileSync(
    REPORT_PATH,
    JSON.stringify(
      { totals, jsChunks, guards: GUARDS, generatedAt: new Date().toISOString() },
      null,
      2,
    ),
  );

  const failed = totalJsEval.status === "fail" || largestEval.status === "fail";
  if (failed) {
    console.error("\nbundle analyzer: one or more guards exceeded the hard limit.");
    process.exit(1);
  }
  if (totalJsEval.status === "warn" || largestEval.status === "warn") {
    console.warn("\nbundle analyzer: one or more guards above the warning threshold — review the top-chunk list above.");
  }

  return { totals, jsChunks, failed };
}

if (require.main === module) {
  analyze();
}

module.exports = { analyze, classify, fmt, evaluate, GUARDS };
