/**
 * Data Transfer Object for a single tool returned by the API.
 */
export interface ToolDto {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  requires_auth?: boolean;
  requires_premium?: boolean;
}

/**
 * Data Transfer Object for the full tools catalog returned by the API.
 */
export interface ToolsCatalogDto {
  tools: ToolDto[];
}
