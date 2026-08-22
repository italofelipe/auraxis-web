/**
 * Client de `/v2/bank-import/statements/*`.
 *
 * Reusa a instância Axios do import (`useImportHttp`) — a regra do projeto é um
 * cliente HTTP por runtime, e criar outro aqui perderia os interceptors de
 * auth, refresh e request-id.
 */

import type { AxiosInstance } from "axios";

import {
  IMPORT_CONFIRM_TIMEOUT_MS,
  unwrapEnvelope,
  useImportHttp,
} from "~/features/import/api/import.client";
import {
  mapDecisionToDto,
  mapStatementConfirmResult,
  mapStatementPreview,
} from "~/features/import/api/statement-import.mapper";
import type {
  StatementConfirmResponseDto,
  StatementPreviewDto,
} from "~/features/import/contracts/statement-import.dto";
import type {
  StatementConfirmResult,
  StatementDecision,
  StatementPreview,
} from "~/features/import/model/statement-import";

const BASE_PATH = "/v2/bank-import/statements";

/** Comando de upload do extrato. */
export interface StatementUploadCommand {
  readonly file: File;
  /**
   * Conta de destino. Obrigatória, e não inferida: um extrato concilia contra
   * uma conta, e adivinhar qual tornaria toda a detecção de duplicidade errada
   * de um jeito que o usuário não teria como perceber.
   */
  readonly accountId: string;
}

/** Comando de confirmação. */
export interface StatementConfirmCommand {
  readonly previewToken: string;
  readonly accountId: string;
  readonly decisions: readonly StatementDecision[];
}

export class StatementImportClient {
  readonly #http: AxiosInstance;

  /**
   * @param http Instância Axios já configurada para o api-v2.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Sobe o PDF e devolve a prévia completa. Nada é criado.
   *
   * @param command Arquivo e conta de destino.
   * @returns A prévia para revisão.
   */
  async upload(command: StatementUploadCommand): Promise<StatementPreview> {
    const formData = new FormData();
    formData.append("file", command.file);
    formData.append("account_id", command.accountId);
    const response = await this.#http.post<StatementPreviewDto>(
      `${BASE_PATH}/upload`,
      formData,
    );
    return mapStatementPreview(unwrapEnvelope(response.data));
  }

  /**
   * Relê a prévia depois de um refresh.
   *
   * @param previewToken Token do upload.
   * @returns A mesma prévia.
   */
  async preview(previewToken: string): Promise<StatementPreview> {
    // `/preview` no fim, e não só o token: sem o sufixo a rota do backend
    // captura "upload" como se fosse um token, e um GET no endpoint de upload
    // responde 404 em vez de 405.
    const response = await this.#http.get<StatementPreviewDto>(
      `${BASE_PATH}/${previewToken}/preview`,
    );
    return mapStatementPreview(unwrapEnvelope(response.data));
  }

  /**
   * Aplica as decisões revisadas.
   *
   * Usa o timeout longo do confirm: uma linha vira um POST no v1, e um extrato
   * de seis meses são centenas deles.
   *
   * @param command Token, conta e decisões.
   * @returns O que foi criado, vinculado e ignorado.
   */
  async confirm(command: StatementConfirmCommand): Promise<StatementConfirmResult> {
    const response = await this.#http.post<StatementConfirmResponseDto>(
      `${BASE_PATH}/${command.previewToken}/confirm`,
      {
        account_id: command.accountId,
        decisions: command.decisions.map(mapDecisionToDto),
      },
      { timeout: IMPORT_CONFIRM_TIMEOUT_MS },
    );
    return mapStatementConfirmResult(unwrapEnvelope(response.data));
  }
}

/**
 * Instância do client para uso nas queries.
 *
 * @returns O client ligado ao Axios do import.
 */
export const useStatementImportClient = (): StatementImportClient =>
  new StatementImportClient(useImportHttp());
