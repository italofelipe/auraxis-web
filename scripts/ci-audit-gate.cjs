#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const { execSync } = require("node:child_process");

const allowedIds = new Set([
  "GHSA-3ppc-4f35-3m26",
  "GHSA-7r86-cg39-jmmj",
  "GHSA-23c5-xmqv-rm74",
  "1113371",
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
  fs.writeFileSync("audit.json", rawAudit);

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
