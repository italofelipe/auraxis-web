import type { AxiosInstance } from "axios";

import { refreshAccessToken } from "~/composables/useHttp/useHttp";
import { createHttpClient } from "~/core/http/http-client";
import type {
  ConfirmResponseDto,
  DetectResponseDto,
  PreviewResponseDto,
} from "~/features/import/contracts/import.dto";
import {
  mapConfirmResponse,
  mapDetectResponse,
  mapPreviewResponse,
} from "~/features/import/api/import.mapper";
import type {
  ImportColumnMapping,
  ImportConfirmCommand,
  ImportConfirmResult,
  ImportDetectResult,
  ImportPreview,
  ImportPreviewCommand,
} from "~/features/import/model/import";
import { useSessionStore } from "~/stores/session";

const DEFAULT_API_BASE = "http://localhost:5000";
const DEFAULT_API_V2_BASE = "http://localhost:8001";

const DETECT_PATH = "/v2/import/detect";
const PREVIEW_PATH = "/v2/import/preview";
const CONFIRM_PATH = "/v2/import/confirm";

/**
 * Timeout do confirm, em ms.
 *
 * O default do `createHttpClient` é 15 s, o que serve para uma chamada comum
 * mas não para esta: o confirm é uma requisição só que, no backend, dispara
 * até 1000 `POST /transactions` no v1 em lotes de 4 (`Semaphore(4)`), cada um
 * com 30 s de timeout próprio. A 120 ms por lote, 1000 linhas levam ~30 s —
 * o dobro do que o cliente esperava. O Axios abortava, o usuário via um erro
 * genérico e o backend seguia gravando (#1309).
 */
const CONFIRM_TIMEOUT_MS = 180_000;

let cachedImportClient: AxiosInstance | null = null;

/**
 * Desembrulha o envelope v2 (`{ data: ... }`), tolerando respostas flat dos
 * mocks. Local por decisão de fronteira: a versão do admin é de outra feature
 * e features não importam umas das outras.
 *
 * @param payload Corpo cru da resposta.
 * @returns Conteúdo útil da resposta.
 */
const unwrapEnvelope = <T>(payload: T | { readonly data?: T | null }): T => {
  if (
    payload !== null &&
    typeof payload === "object" &&
    "data" in payload &&
    payload.data !== undefined &&
    payload.data !== null
  ) {
    return payload.data as T;
  }
  return payload as T;
};

/**
 * Cliente HTTP do api-v2 usado pelo import. Mesmo desenho do admin: bearer da
 * sessão em memória e refresh pelo cookie httpOnly do v1 em caso de 401.
 *
 * @returns Instância Axios apontada para o api-v2.
 */
export const useImportHttp = (): AxiosInstance => {
  if (cachedImportClient) {
    return cachedImportClient;
  }

  const config = useRuntimeConfig();
  const session = useSessionStore();
  const apiBase = String(config.public.apiBase ?? DEFAULT_API_BASE);
  const apiV2Base = String(config.public.apiV2Base ?? DEFAULT_API_V2_BASE);
  const client = createHttpClient(apiV2Base, () => session.getAccessToken(), {
    onUnauthorized: () => refreshAccessToken(apiBase, session),
  });

  if (import.meta.client) {
    cachedImportClient = client;
  }
  return client;
};

/** Limpa o cliente memoizado entre testes. */
export const __resetImportHttpForTests = (): void => {
  cachedImportClient = null;
};

/**
 * Serializa o mapeamento no formato que o backend espera no campo `mapping`.
 *
 * @param mapping Mapeamento de colunas escolhido.
 * @returns JSON com as chaves em snake_case.
 */
const serializeMapping = (mapping: ImportColumnMapping): string => {
  const payload: Record<string, string> = {
    date_column: mapping.dateColumn,
    description_column: mapping.descriptionColumn,
    amount_column: mapping.amountColumn,
    type_column: mapping.typeColumn,
  };

  if (mapping.sheetName) {
    payload.sheet_name = mapping.sheetName;
  }

  return JSON.stringify(payload);
};

/**
 * Client do import CSV/XLSX contra `/v2/import/*`.
 *
 * Os três passos são multipart ou JSON puro conforme o backend define, e todas
 * as respostas passam pelo unwrap do envelope v2 antes do mapper.
 */
export class ImportClient {
  readonly #http: AxiosInstance;

  /**
   * @param http Instância Axios já configurada para o api-v2.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Detecta colunas e amostras do arquivo.
   *
   * @param file Arquivo escolhido pelo usuário.
   * @returns Colunas detectadas, amostras e confiança por campo.
   */
  async detect(file: File): Promise<ImportDetectResult> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await this.#http.post<DetectResponseDto>(DETECT_PATH, formData);
    return mapDetectResponse(unwrapEnvelope(response.data));
  }

  /**
   * Gera o preview das transações com o mapeamento escolhido.
   *
   * @param command Arquivo e mapeamento de colunas.
   * @returns Preview com drafts, duplicatas e linhas rejeitadas.
   */
  async preview(command: ImportPreviewCommand): Promise<ImportPreview> {
    const formData = new FormData();
    formData.append("file", command.file);
    formData.append("mapping", serializeMapping(command.mapping));
    const response = await this.#http.post<PreviewResponseDto>(PREVIEW_PATH, formData);
    return mapPreviewResponse(unwrapEnvelope(response.data));
  }

  /**
   * Confirma o import, opcionalmente com as respostas da conferência.
   *
   * @param command Token do preview, exclusões e completions.
   * @returns Contagens e erros por linha devolvidos pelo backend.
   */
  async confirm(command: ImportConfirmCommand): Promise<ImportConfirmResult> {
    const response = await this.#http.post<ConfirmResponseDto>(
      CONFIRM_PATH,
      {
        preview_token: command.previewToken,
        exclude_ids: command.excludeIds,
        completions: command.completions ?? {},
        use_generic_placeholders: command.useGenericPlaceholders ?? false,
      },
      { timeout: CONFIRM_TIMEOUT_MS },
    );
    return mapConfirmResponse(unwrapEnvelope(response.data), command.excludeIds.length);
  }
}

/**
 * Fábrica do client de import para uso nas queries.
 *
 * @returns Client pronto para as três chamadas do wizard.
 */
export const useImportClient = (): ImportClient => new ImportClient(useImportHttp());
