#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const PRODUCT_DIRECTORIES = ["app"];
const REQUIRED_SHARED_DIRECTORIES = [
  "app/shared/components",
  "app/shared/types",
  "app/shared/validators",
  "app/shared/utils",
];
const DISALLOWED_SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".cjs", ".mjs"]);
const DISALLOWED_SOURCE_PATTERNS = [
  /^app\/(components|composables|layouts|middleware|pages|plugins|schemas|services|stores|types|utils)\/.*\.(js|jsx|cjs|mjs)$/,
];
const STYLE_SCAN_EXTENSIONS = new Set([".vue", ".css", ".scss", ".sass"]);
const STYLE_TOKEN_EXCLUDE_PATTERNS = [
  /^app\/assets\/css\/main\.css$/,
  /^app\/theme\/.+/,
];
const DISALLOWED_STYLE_LITERALS = [
  {
    rule: "numeric font-weight outside tokens",
    pattern: /font-weight\s*:\s*(?!var\()[0-9]+/i,
  },
  {
    rule: "literal font-size outside tokens",
    pattern: /font-size\s*:\s*(?!var\()[0-9.]+(px|rem|em)/i,
  },
  {
    rule: "literal line-height outside tokens",
    pattern: /line-height\s*:\s*(?!var\()[0-9.]+(px|rem|em)/i,
  },
  {
    rule: "literal border-radius outside tokens",
    pattern: /border-radius\s*:\s*(?!var\()[0-9.]+(px|rem|em)/i,
  },
  {
    rule: "literal border color outside tokens",
    pattern: /border\s*:\s*[0-9.]+(px|rem|em)\s+solid\s+#/i,
  },
];

function walkDirectoryRecursively(rootDirectory) {
  const visitedFiles = [];

  if (!fs.existsSync(rootDirectory)) {
    return visitedFiles;
  }

  const stack = [rootDirectory];

  while (stack.length > 0) {
    const currentDirectory = stack.pop();
    const entries = fs.readdirSync(currentDirectory, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".nuxt" || entry.name === ".output") {
        continue;
      }

      const absoluteEntryPath = path.join(currentDirectory, entry.name);

      if (entry.isDirectory()) {
        stack.push(absoluteEntryPath);
        continue;
      }

      visitedFiles.push(absoluteEntryPath);
    }
  }

  return visitedFiles;
}

function toUnixRelativePath(absolutePath, rootDirectory) {
  const relativePath = path.relative(rootDirectory, absolutePath);
  return relativePath.split(path.sep).join("/");
}

function assertRequiredSharedDirectoriesExist(errors, rootDirectory) {
  for (const relativeDirectory of REQUIRED_SHARED_DIRECTORIES) {
    const absoluteDirectory = path.resolve(rootDirectory, relativeDirectory);

    if (!fs.existsSync(absoluteDirectory) || !fs.statSync(absoluteDirectory).isDirectory()) {
      errors.push(`missing required shared directory: ${relativeDirectory}`);
    }
  }
}

function checkDisallowedSourceExtensions(errors, rootDirectory) {
  for (const productDirectory of PRODUCT_DIRECTORIES) {
    const absoluteProductDirectory = path.resolve(rootDirectory, productDirectory);
    const files = walkDirectoryRecursively(absoluteProductDirectory);

    for (const filePath of files) {
      const relativePath = toUnixRelativePath(filePath, rootDirectory);
      const extension = path.extname(relativePath);

      if (!DISALLOWED_SOURCE_EXTENSIONS.has(extension)) {
        continue;
      }

      const isDisallowedByPattern = DISALLOWED_SOURCE_PATTERNS.some((pattern) => {
        return pattern.test(relativePath);
      });

      if (isDisallowedByPattern) {
        errors.push(`disallowed product source extension detected: ${relativePath}`);
      }
    }
  }
}

function checkDisallowedStyleLiterals(errors, rootDirectory) {
  const files = walkDirectoryRecursively(path.resolve(rootDirectory, "app"));

  for (const absoluteFilePath of files) {
    const relativePath = toUnixRelativePath(absoluteFilePath, rootDirectory);
    const extension = path.extname(relativePath);

    if (!STYLE_SCAN_EXTENSIONS.has(extension)) {
      continue;
    }

    const isExcluded = STYLE_TOKEN_EXCLUDE_PATTERNS.some((pattern) => {
      return pattern.test(relativePath);
    });

    if (isExcluded) {
      continue;
    }

    const fileContent = fs.readFileSync(absoluteFilePath, "utf8");
    const fileLines = fileContent.split("\n");

    fileLines.forEach((lineContent, lineIndex) => {
      for (const styleRule of DISALLOWED_STYLE_LITERALS) {
        if (styleRule.pattern.test(lineContent)) {
          errors.push(
            `${styleRule.rule}: ${relativePath}:${lineIndex + 1}`,
          );
        }
      }
    });
  }
}

function main() {
  const rootDirectory = process.cwd();
  const errors = [];

  assertRequiredSharedDirectoriesExist(errors, rootDirectory);
  checkDisallowedSourceExtensions(errors, rootDirectory);
  checkDisallowedStyleLiterals(errors, rootDirectory);

  if (errors.length > 0) {
    process.stderr.write("[frontend-governance] FAILED\n");

    for (const error of errors) {
      process.stderr.write(` - ${error}\n`);
    }

    process.exit(1);
  }

  process.stdout.write("[frontend-governance] OK\n");
}

main();
