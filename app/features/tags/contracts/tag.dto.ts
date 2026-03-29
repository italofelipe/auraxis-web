export type TagDto = {
  readonly id: string;
  readonly name: string;
};

export type CreateTagPayload = {
  readonly name: string;
};

export type UpdateTagPayload = {
  readonly name: string;
};
