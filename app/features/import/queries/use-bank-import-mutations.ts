import { type UseMutationReturnType, useMutation } from "@tanstack/vue-query";

import {
  useBankImportClient,
  type BankImportClient,
} from "~/features/import/api/bank-import.client";
import type {
  BankImportConfirmCommand,
  BankImportPreview,
  BankImportUploadCommand,
} from "~/features/import/model/bank-import";
import type { ImportConfirmResult } from "~/features/import/model/import";

/**
 * Upload do extrato, que já devolve a prévia (passo 1 do wizard).
 *
 * @param providedClient Client injetado nos testes.
 * @returns Mutation com a prévia do extrato.
 */
export const useUploadBankStatementMutation = (
  providedClient?: BankImportClient,
): UseMutationReturnType<
  BankImportPreview,
  Error,
  BankImportUploadCommand,
  unknown
> => {
  const client = providedClient ?? useBankImportClient();

  return useMutation({
    mutationFn: (command: BankImportUploadCommand): Promise<BankImportPreview> =>
      client.upload(command),
  });
};

/**
 * Confirmação do extrato (passo 2).
 *
 * @param providedClient Client injetado nos testes.
 * @returns Mutation com contagens e erros por linha.
 */
export const useConfirmBankStatementMutation = (
  providedClient?: BankImportClient,
): UseMutationReturnType<
  ImportConfirmResult,
  Error,
  BankImportConfirmCommand,
  unknown
> => {
  const client = providedClient ?? useBankImportClient();

  return useMutation({
    mutationFn: (command: BankImportConfirmCommand): Promise<ImportConfirmResult> =>
      client.confirm(command),
  });
};
