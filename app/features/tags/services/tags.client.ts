import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type {
  CreateTagPayload,
  TagDto,
  UpdateTagPayload,
} from "~/features/tags/contracts/tag.dto";

/**
 * API client for the tags feature.
 *
 * Encapsulates all HTTP calls to the `/tags` endpoints.
 */
export class TagsClient {
  readonly #http: AxiosInstance;

  /**
   *
   * @param http
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Fetches the list of tags for the authenticated user.
   * @returns Array of TagDto objects.
   */
  async listTags(): Promise<TagDto[]> {
    const response = await this.#http.get<{ data: { tags: TagDto[] } }>("/tags");
    return response.data.data?.tags ?? (response.data as unknown as TagDto[]);
  }

  /**
   * Creates a new tag.
   * @param payload - Tag creation payload.
   * @returns The created TagDto.
   */
  async createTag(payload: CreateTagPayload): Promise<TagDto> {
    const response = await this.#http.post<{ data: { tag: TagDto } }>("/tags", payload);
    return response.data.data.tag;
  }

  /**
   * Updates an existing tag by id.
   * @param id - Tag UUID.
   * @param payload - Update payload.
   * @returns The updated TagDto.
   */
  async updateTag(id: string, payload: UpdateTagPayload): Promise<TagDto> {
    const response = await this.#http.put<{ data: { tag: TagDto } }>(`/tags/${id}`, payload);
    return response.data.data.tag;
  }

  /**
   * Deletes a tag by id.
   * @param id
   */
  async deleteTag(id: string): Promise<void> {
    await this.#http.delete(`/tags/${id}`);
  }
}

/**
 * Resolves the canonical tags API client using the shared HTTP layer.
 * @returns TagsClient instance bound to the application HTTP adapter.
 */
export const useTagsClient = (): TagsClient => new TagsClient(useHttp());
