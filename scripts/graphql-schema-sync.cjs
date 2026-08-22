#!/usr/bin/env node

/**
 * Atualiza o snapshot commitado do schema GraphQL da API e regenera os tipos.
 *
 * O codegen roda contra `contracts/schema.graphql` — um arquivo versionado neste
 * repo — e não contra a `master` da auraxis-api em runtime. Sem isso, qualquer
 * merge na API que mexa no schema deixa o CI do web vermelho sozinho, inclusive
 * em PRs que não têm nada a ver com GraphQL (web#1326).
 *
 * Subir o ponteiro do contrato passa a ser este comando, com diff revisável.
 */

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");

const {
  GRAPHQL_SCHEMA_PATH,
  GRAPHQL_SCHEMA_URL,
} = require("./contracts.config.cjs");
const { ensureParentDirectory } = require("./contracts.utils.cjs");

const readSchemaFromSource = async (url, localFilePath) => {
  if (localFilePath.length > 0) {
    if (!fs.existsSync(localFilePath)) {
      throw new Error(`local schema file not found: ${localFilePath}`);
    }
    return fs.readFileSync(localFilePath, "utf8");
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`fetch failed (${response.status}) for ${url}`);
  }
  return response.text();
};

const run = async () => {
  const localSchemaPath = process.env.AURAXIS_GRAPHQL_LOCAL_FILE ?? "";
  const schema = await readSchemaFromSource(GRAPHQL_SCHEMA_URL, localSchemaPath);

  if (schema.trim().length === 0) {
    throw new Error("refusing to write an empty schema snapshot");
  }

  ensureParentDirectory(GRAPHQL_SCHEMA_PATH);
  fs.writeFileSync(GRAPHQL_SCHEMA_PATH, schema, "utf8");

  const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
  execFileSync(npxCommand, ["graphql-codegen", "--config", "codegen.ts"], {
    stdio: "inherit",
  });

  const sourceLabel =
    localSchemaPath.length > 0 ? localSchemaPath : GRAPHQL_SCHEMA_URL;

  process.stdout.write(
    `[graphql:sync] snapshot=${GRAPHQL_SCHEMA_PATH}\n`
      + `[graphql:sync] source=${sourceLabel}\n`,
  );
};

run().catch((error) => {
  process.stderr.write(`[graphql:sync] FAILED: ${error.message}\n`);
  process.exit(1);
});
