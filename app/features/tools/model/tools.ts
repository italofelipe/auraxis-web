import type { ToolDto } from "~/features/tools/contracts/tools.dto";

/**
 * Access level required to use a tool.
 * - public: available to all visitors without authentication
 * - authenticated: requires a logged-in session
 * - premium: requires a premium subscription
 */
export type ToolAccessLevel = "public" | "authenticated" | "premium";

/**
 * Domain model for a single tool, derived from ToolDto with camelCase naming.
 */
export interface Tool {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  accessLevel: ToolAccessLevel;
}

/**
 * Domain model for the full tools catalog.
 */
export interface ToolsCatalog {
  tools: Tool[];
}

/**
 * Maps a raw ToolDto from the API into the domain Tool model.
 * @param dto Raw DTO from the API response.
 * @returns Typed domain model with resolved accessLevel.
 */
export const mapToolDtoToModel = (dto: ToolDto): Tool => {
  let accessLevel: ToolAccessLevel = "public";
  if (dto.requires_premium) {
    accessLevel = "premium";
  } else if (dto.requires_auth) {
    accessLevel = "authenticated";
  }

  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    enabled: dto.enabled,
    accessLevel,
  };
};

/**
 * Maps a raw ToolsCatalogDto into the domain ToolsCatalog model.
 * @param dto Raw catalog DTO from the API response.
 * @param dto.tools Array of raw tool DTOs.
 * @returns Typed domain catalog model.
 */
export const mapToolsCatalogDtoToModel = (dto: { tools: ToolDto[] }): ToolsCatalog => {
  return {
    tools: dto.tools.map(mapToolDtoToModel),
  };
};
