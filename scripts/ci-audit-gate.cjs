#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execSync } = require("node:child_process");

const allowedIds = new Set([
  "GHSA-3ppc-4f35-3m26",
  "GHSA-7r86-cg39-jmmj",
  "GHSA-23c5-xmqv-rm74",
  "1113371",
  // h3 vulnerabilities — transitive via nuxt@4.4.2 core deps; no patch available
  // within the current nuxt major. Tracked for resolution on nuxt upgrade.
  "GHSA-3vj8-jmxq-cgj5",
  "GHSA-22cc-p3c6-wpvm",
  // lodash / lodash-es — GHSA-r5fr-rjxr-66jc (HIGH) affects all 4.x; 4.17.23
  // is the latest patch available and there is no 5.x release yet. Allowlisted
  // because Auraxis does not use _.template directly and naive-ui's transitive
  // usage is not reachable by user input. Tracked via:
  //   - Issue: italofelipe/auraxis-platform#627 (SEC-AUD-11)
  //   - ADR:   auraxis-platform/.context/adr/lodash_es_high_strategy.md
  //   - Cron:  auraxis-platform/.github/workflows/lodash-es-upstream-check.yml
  "GHSA-r5fr-rjxr-66jc",
]);
const isBlockingSeverity = (severity) => severity === "high" || severity === "critical";
const isAllowlisted = (ghsa, source) => allowedIds.has(ghsa) || allowedIds.has(source);

const runAudit = () => {
  try {
    return execSync("pnpm audit --json", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const stdout = typeof error.stdout === "string" ? error.stdout : "";
    if (stdout.trim().length > 0) {
      return stdout;
    }

    const stderr = typeof error.stderr === "string" ? error.stderr : "";
    throw new Error(`pnpm audit failed without JSON output: ${stderr}`);
  }
};

const resolveAuditOutputPath = () => {
  const configuredPath = process.env.AURAXIS_AUDIT_OUTPUT_PATH;
  if (typeof configuredPath === "string" && configuredPath.trim().length > 0) {
    return path.resolve(configuredPath);
  }

  return path.join(os.tmpdir(), `auraxis-web-audit-${process.pid}.json`);
};

const persistAuditReport = (rawAudit) => {
  const outputPath = resolveAuditOutputPath();
  fs.writeFileSync(outputPath, rawAudit, "utf8");

  if (process.env.AURAXIS_AUDIT_DEBUG === "true") {
    console.warn(`[audit-gate] raw report written to: ${outputPath}`);
  }
};

const parseAudit = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    const preview = raw.slice(0, 500);
    throw new Error(`Unable to parse pnpm audit output as JSON. Preview: ${preview}`);
  }
};

const collectFindings = (audit) => {
  const advisories = Object.entries(audit.advisories || {});

  return advisories
    .map(([id, advisory]) => {
      const severity = advisory.severity || "unknown";
      const ghsa = advisory.github_advisory_id || "";
      const source = String(advisory.id || id);

      return {
        severity,
        ghsa,
        source,
        module: advisory.module_name || "unknown",
        title: advisory.title || "unknown",
      };
    })
    .filter((advisory) => isBlockingSeverity(advisory.severity))
    .filter((advisory) => !isAllowlisted(advisory.ghsa, advisory.source))
    .map((advisory) => ({
      severity: advisory.severity,
      module: advisory.module,
      id: advisory.ghsa || advisory.source || advisory.title,
    }));
};

const main = () => {
  const rawAudit = runAudit();
  persistAuditReport(rawAudit);

  const audit = parseAudit(rawAudit);
  const findings = collectFindings(audit);

  if (findings.length > 0) {
    console.error("Disallowed high/critical vulnerabilities found:");
    for (const finding of findings) {
      console.error(`- [${finding.severity}] ${finding.module}: ${finding.id}`);
    }
    process.exit(1);
  }

  console.warn("Audit gate passed (only allowlisted minimatch advisory detected).");
};

main();
