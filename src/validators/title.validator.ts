import { z } from "zod";

export const titleGenerationSchema = z.object({
  dates: z.array(z.string()).optional(),
  organizationId: z.string(),
}).refine(data => {
  return !!data.dates && data.dates.length > 0;
}, {
  message: "Invalid configuration for the selected type",
});

export type TitleGenerationRequest = z.infer<typeof titleGenerationSchema>;
