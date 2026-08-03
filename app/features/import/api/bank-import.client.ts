import type { AxiosInstance } from "axios";

import {
  IMPORT_CONFIRM_TIMEOUT_MS,
  unwrapEnvelope,
  useImportHttp,
} from "~/features/import/api/import.client";
import {
  mapBankConfirmResponse,
  mapBankUploadResponse,
} from "~/features/import/api/bank-import.mapper";
import type {
  BankConfirmResponseDto,
  BankUploadResponseDto,
} from "~/features/import/contracts/bank-import.dto";
import type {
  BankImportConfirmCommand,
  BankImportPreview,
  BankImportUploadCommand,
} from "~/features/import/model/bank-import";
import type { ImportConfirmResult } from "~/features/import/model/import";

const UPLOAD_PATH = "/v2/bank-import/upload";

/**
 * Client do import de extrato bancário contra `/v2/bank-import/*`.
 *
 * São dois passos, não três: o upload já devolve o preview porque o formato do
 * arquivo dispensa a etapa de mapeamento de colunas do wizard de planilha.
 */
export class BankImportClient {
  readonly #http: AxiosInstance;

  /**
   * @param http Instância Axios já configurada para o api-v2.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Sobe o arquivo e devolve a prévia já parseada.
   *
   * O `bank_id` vai como query param e só existe para `.csv`: mandar em um OFX
   * é inofensivo, mas mandar `null` num CSV faz o backend adivinhar o layout
   * acima de 0.8 de confiança — palpite errado inverte a convenção de sinal.
   *
   * @param command Arquivo e banco escolhido.
   * @returns Prévia com o token, as linhas e as duplicatas marcadas.
   */
  async upload(command: BankImportUploadCommand): Promise<BankImportPreview> {
    const formData = new FormData();
    formData.append("file", command.file);
    const response = await this.#http.post<BankUploadResponseDto>(
      UPLOAD_PATH,
      formData,
      command.bankId ? { params: { bank_id: command.bankId } } : undefined,
    );
    return mapBankUploadResponse(unwrapEnvelope(response.data));
  }

  /**
   * Confirma a prévia, criando as transações de verdade.
   *
   * Mesmo timeout longo do import de planilha: o confirm dispara a criação em
   * lote no v1 e uma resposta de 15 s não cobre um extrato mensal cheio.
   *
   * @param command Token da prévia e ids desmarcados.
   * @returns Contagens e erros por linha devolvidos pelo backend.
   */
  async confirm(command: BankImportConfirmCommand): Promise<ImportConfirmResult> {
    const response = await this.#http.post<BankConfirmResponseDto>(
      `/v2/bank-import/${encodeURIComponent(command.previewToken)}/confirm`,
      { exclude_ids: command.excludeIds },
      { timeout: IMPORT_CONFIRM_TIMEOUT_MS },
    );
    return mapBankConfirmResponse(
      unwrapEnvelope(response.data),
      command.excludeIds.length,
    );
  }
}

/**
 * Fábrica do client de extrato bancário para uso nas queries.
 *
 * @returns Client pronto para o upload e o confirm.
 */
export const useBankImportClient = (): BankImportClient =>
  new BankImportClient(useImportHttp());
