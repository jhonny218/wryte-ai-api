export enum QueueName {
  TITLE_GENERATION = "title-generation",
}

export interface TitleGenerationJobProtocol {
  userId: string;
  organizationId: string;
  dates: string[];
}
