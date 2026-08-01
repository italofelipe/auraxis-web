import { type UseMutationReturnType, useMutation } from "@tanstack/vue-query";

import { useImportClient, type ImportClient } from "~/features/import/api/import.client";
import type {
  ImportConfirmCommand,
  ImportConfirmResult,
  ImportDetectResult,
  ImportPreview,
  ImportPreviewCommand,
} from "~/features/import/model/import";

/**
 * Detecção de colunas do arquivo (passo 1 do wizard).
 *
 * @param providedClient Client injetado nos testes.
 * @returns Mutation com o resultado da detecção.
 */
export const useDetectImportMutation = (
  providedClient?: ImportClient,
): UseMutationReturnType<ImportDetectResult, Error, File, unknown> => {
  const client = providedClient ?? useImportClient();

  return useMutation({
    mutationFn: (file: File): Promise<ImportDetectResult> => client.detect(file),
  });
};

/**
 * Preview das transações com o mapeamento escolhido (passo 2).
 *
 * @param providedClient Client injetado nos testes.
 * @returns Mutation com o preview.
 */
export const usePreviewImportMutation = (
  providedClient?: ImportClient,
): UseMutationReturnType<ImportPreview, Error, ImportPreviewCommand, unknown> => {
  const client = providedClient ?? useImportClient();

  return useMutation({
    mutationFn: (command: ImportPreviewCommand): Promise<ImportPreview> =>
      client.preview(command),
  });
};

/**
 * Confirmação do import (passo 3), com as respostas da conferência quando houver.
 *
 * @param providedClient Client injetado nos testes.
 * @returns Mutation com contagens e erros por linha.
 */
export const useConfirmImportMutation = (
  providedClient?: ImportClient,
): UseMutationReturnType<ImportConfirmResult, Error, ImportConfirmCommand, unknown> => {
  const client = providedClient ?? useImportClient();

  return useMutation({
    mutationFn: (command: ImportConfirmCommand): Promise<ImportConfirmResult> =>
      client.confirm(command),
  });
};
