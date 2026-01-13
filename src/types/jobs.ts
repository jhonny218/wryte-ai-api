export enum QueueName {
  TITLE_GENERATION = "title-generation",
  OUTLINE_GENERATION = "outline-generation",
  BLOG_GENERATION = "blog-generation",
}

export interface TitleGenerationJobProtocol {
  userId: string;
  organizationId: string;
  dates: string[];
}

export interface OutlineGenerationJobProtocol {
  userId: string;
  organizationId: string;
  blogTitleId: string;
  additionalInstructions?: string;
}

export interface BlogGenerationJobProtocol {
  userId: string;
  organizationId: string;
  blogOutlineId: string;
  additionalInstructions?: string;
}
