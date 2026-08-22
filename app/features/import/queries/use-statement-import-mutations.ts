/**
 * Mutations do import de extrato em PDF.
 *
 * Único ponto que toca API e cache, como manda a estrutura de feature. O
 * `providedClient` existe para injeção em teste.
 */

import { type UseMutationReturnType, useMutation } from "@tanstack/vue-query";

import {
  type StatementConfirmCommand,
  type StatementImportClient,
  type StatementUploadCommand,
  useStatementImportClient,
} from "~/features/import/api/statement-import.client";
import type {
  StatementConfirmResult,
  StatementPreview,
} from "~/features/import/model/statement-import";

/**
 * Sobe o extrato e devolve a prévia.
 *
 * @param providedClient Client injetado em teste.
 * @returns Estado da mutation.
 */
export const useStatementUploadMutation = (
  providedClient?: StatementImportClient,
): UseMutationReturnType<StatementPreview, Error, StatementUploadCommand, unknown> => {
  const client = providedClient ?? useStatementImportClient();
  return useMutation({
    mutationKey: ["import", "statement", "upload"] as const,
    mutationFn: (command: StatementUploadCommand): Promise<StatementPreview> =>
      client.upload(command),
  });
};

/**
 * Confirma as decisões revisadas.
 *
 * @param providedClient Client injetado em teste.
 * @returns Estado da mutation.
 */
export const useStatementConfirmMutation = (
  providedClient?: StatementImportClient,
): UseMutationReturnType<
  StatementConfirmResult,
  Error,
  StatementConfirmCommand,
  unknown
> => {
  const client = providedClient ?? useStatementImportClient();
  return useMutation({
    mutationKey: ["import", "statement", "confirm"] as const,
    mutationFn: (command: StatementConfirmCommand): Promise<StatementConfirmResult> =>
      client.confirm(command),
  });
};
