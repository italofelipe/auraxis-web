import type { AlertDto, AlertPreferenceDto } from "~/features/alerts/contracts/alerts.dto";
import type { Alert, AlertPreference } from "~/features/alerts/model/alerts";

/**
 * Maps a raw alert DTO from the API into the internal Alert view model.
 *
 * @param dto Raw alert payload from the API (snake_case).
 * @returns Mapped Alert view model (camelCase).
 */
export const mapAlertDto = (dto: AlertDto): Alert => {
  return {
    id: dto.id,
    type: dto.type,
    title: dto.title,
    body: dto.body,
    severity: dto.severity,
    readAt: dto.read_at,
    createdAt: dto.created_at,
  };
};

/**
 * Maps a raw alert preference DTO from the API into the internal AlertPreference view model.
 *
 * @param dto Raw alert preference payload from the API (snake_case).
 * @returns Mapped AlertPreference view model (camelCase).
 */
export const mapAlertPreferenceDto = (dto: AlertPreferenceDto): AlertPreference => {
  return {
    id: dto.id,
    category: dto.category,
    enabled: dto.enabled,
    channels: dto.channels,
  };
};
