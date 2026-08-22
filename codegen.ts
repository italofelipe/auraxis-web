import type { CodegenConfig } from "@graphql-codegen/cli";

// O schema e um snapshot VERSIONADO neste repo (contracts/schema.graphql),
// nao a master da auraxis-api lida em runtime. Buscar ao vivo deixava o CI
// vermelho sozinho a cada merge de schema na API, inclusive em PRs sem
// nenhuma relacao com GraphQL (web#1326).
//
// Para subir o contrato: `pnpm graphql:sync` (gera o diff do schema + tipos).
// GRAPHQL_SCHEMA_PATH continua disponivel como override pontual.
const schema: string =
  process.env["GRAPHQL_SCHEMA_PATH"] ?? "contracts/schema.graphql";

const config: CodegenConfig = {
  schema,
  documents: ["app/**/*.{ts,vue,graphql,gql}"],
  generates: {
    "app/shared/types/generated/graphql.ts": {
      plugins: ["typescript", "typescript-operations", "typed-document-node"],
      config: {
        strictScalars: true,
        scalars: {
          UUID: "string",
          DecimalScalar: "string",
          DateTime: "string",
          JSONString: "string",
        },
        enumsAsTypes: true,
        avoidOptionals: false,
        nonOptionalTypename: false,
        useTypeImports: true,
      },
    },
  },
  ignoreNoDocuments: true,
};

export default config;
