export interface QuestionnaireOptionDto {
  readonly id: number;
  readonly text: string;
  readonly points: number;
}

export interface QuestionnaireQuestionDto {
  readonly id: number;
  readonly text: string;
  readonly options: readonly QuestionnaireOptionDto[];
}

export interface QuestionnaireDto {
  readonly questions: readonly QuestionnaireQuestionDto[];
}

export interface QuestionnaireResultDto {
  readonly suggested_profile: "conservador" | "explorador" | "entusiasta";
  readonly score: number;
}

export interface SubmitAnswersPayload {
  readonly answers: readonly number[];
}
