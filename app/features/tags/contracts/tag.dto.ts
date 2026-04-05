export type TagDto = {
  readonly id: string;
  readonly name: string;
  readonly color: string | null;
  readonly icon: string | null;
};

export type CreateTagPayload = {
  readonly name: string;
  readonly color?: string | null;
  readonly icon?: string | null;
};

export type UpdateTagPayload = {
  readonly name: string;
  readonly color?: string | null;
  readonly icon?: string | null;
};
