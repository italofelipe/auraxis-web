#!/usr/bin/env node
/*
 * Validate key parity between app/i18n/locales/pt.json and en.json.
 *
 * MVP1 mode (default, reflects DEC-186 EN freeze):
 *   - EN is the frozen baseline; PT is the actively-maintained locale.
 *   - Hard-fail if any EN key is missing in PT. Losing a translation that was
 *     already shipped is a regression.
 *   - Soft-report PT keys missing in EN. This is expected drift while the EN
 *     locale is frozen. These keys will need translation before the freeze
 *     lifts.
 *
 * Strict mode (--strict):
 *   - Hard-fail on either direction. Use this after DEC-186 is lifted.
 *
 * Keys are compared as dot paths including array indices. Leaf values can
 * differ freely — only the *shape* must match.
 */

const fs = require("node:fs");
const path = require("node:path");

const LOCALES_DIR = path.resolve(__dirname, "..", "app", "i18n", "locales");
const PT_FILE = "pt.json";
const EN_FILE = "en.json";
const ALLOWLIST_FILE = path.resolve(__dirname, "i18n-parity-allowlist.json");
const STRICT = process.argv.includes("--strict");

function loadAllowlist() {
  if (!fs.existsSync(ALLOWLIST_FILE)) return new Set();
  const raw = fs.readFileSync(ALLOWLIST_FILE, "utf8");
  const parsed = JSON.parse(raw);
  const keys = Array.isArray(parsed.en_keys_without_pt) ? parsed.en_keys_without_pt : [];
  return new Set(keys);
}

function collectKeys(value, prefix, bucket) {
  if (value === null || value === undefined) {
    bucket.add(prefix);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      collectKeys(item, `${prefix}[${index}]`, bucket);
    });
    return;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      bucket.add(prefix);
      return;
    }
    for (const [key, child] of entries) {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      collectKeys(child, nextPrefix, bucket);
    }
    return;
  }

  bucket.add(prefix);
}

function loadLocale(fileName) {
  const filePath = path.join(LOCALES_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`[i18n-parity] locale file not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, "utf8");
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`[i18n-parity] invalid JSON in ${fileName}: ${error.message}`);
  }
}

function diff(setA, setB) {
  const missing = [];
  for (const key of setA) {
    if (!setB.has(key)) missing.push(key);
  }
  return missing.sort();
}

function format(list, limit = 50) {
  if (list.length === 0) return "  (none)";
  const shown = list.slice(0, limit).map((k) => `  - ${k}`).join("\n");
  const suffix = list.length > limit ? `\n  … and ${list.length - limit} more` : "";
  return `${shown}${suffix}`;
}

function main() {
  const ptKeys = new Set();
  const enKeys = new Set();
  collectKeys(loadLocale(PT_FILE), "", ptKeys);
  collectKeys(loadLocale(EN_FILE), "", enKeys);

  const allowlist = loadAllowlist();
  const rawMissingInPt = diff(enKeys, ptKeys);
  const missingInPt = rawMissingInPt.filter((k) => !allowlist.has(k));
  const allowedOrphans = rawMissingInPt.filter((k) => allowlist.has(k));
  const missingInEn = diff(ptKeys, enKeys); // PT has, EN missing → soft in MVP1

  const staleAllowlist = [...allowlist].filter(
    (k) => !rawMissingInPt.includes(k),
  );
  if (staleAllowlist.length > 0) {
    console.error(
      `[i18n-parity] FAIL — stale allowlist entries (keys no longer missing in ${PT_FILE}):`,
    );
    console.error(format(staleAllowlist));
    console.error(
      `\nFix: remove these from scripts/i18n-parity-allowlist.json.`,
    );
    process.exit(1);
  }

  if (missingInPt.length > 0) {
    console.error(
      `[i18n-parity] FAIL — ${missingInPt.length} key(s) present in ${EN_FILE} but missing in ${PT_FILE}:`,
    );
    console.error(format(missingInPt));
    console.error(
      `\nFix: add the missing keys to ${PT_FILE}. Losing a translation is a regression.`,
    );
    process.exit(1);
  }

  if (missingInEn.length > 0) {
    if (STRICT) {
      console.error(
        `[i18n-parity] FAIL (strict) — ${missingInEn.length} key(s) present in ${PT_FILE} but missing in ${EN_FILE}:`,
      );
      console.error(format(missingInEn));
      console.error(
        `\nFix: add translations to ${EN_FILE} (and update the frozen baseline hash).`,
      );
      process.exit(1);
    }

    console.warn(
      `[i18n-parity] WARN — ${missingInEn.length} PT-only key(s) (expected during DEC-186 EN freeze):`,
    );
    console.warn(format(missingInEn, 10));
    console.warn(
      `\nThese keys must be translated before the EN freeze is lifted.`,
    );
  }

  const total = enKeys.size;
  const notes = [];
  if (missingInEn.length > 0) {
    notes.push(`${missingInEn.length} PT-only keys deferred per DEC-186`);
  }
  if (allowedOrphans.length > 0) {
    notes.push(`${allowedOrphans.length} allowlisted EN orphans`);
  }
  const suffix = notes.length > 0 ? ` (${notes.join("; ")})` : "";
  console.log(
    `[i18n-parity] OK — all ${total} ${EN_FILE} keys resolved against ${PT_FILE}${suffix}`,
  );
}

main();
