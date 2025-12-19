import { ContentSettings } from "../../generated/prisma/client";

export class PromptService {
  generateTitlePrompt(settings: ContentSettings, amount: number, currentMonth?: string): string {
    const { primaryKeywords, secondaryKeywords, tone, targetAudience, industry, goals, topicsToAvoid } = settings;

    let prompt = `Generate ${amount} unique, engaging, and SEO-optimized blog titles`;

    if (industry) prompt += ` for the ${industry} industry`;
    if (targetAudience) prompt += `, targeting ${targetAudience}`;
    prompt += `.\n\n`;

    if (currentMonth) {
      prompt += `Context: These titles should be relevant for creation/publishing around ${currentMonth}.\n`;
    }

    prompt += `Configuration:
- Primary Keywords: ${primaryKeywords.join(", ") || "None"}
- Secondary Keywords: ${secondaryKeywords.join(", ") || "None"}
- Tone: ${tone || "Professional"}
- Goals: ${goals.join(", ") || "Engagement"}
- Topics to Avoid: ${topicsToAvoid.join(", ") || "None"}

Requirements:
1. Return ONLY a valid JSON array of strings. Example: ["Title 1", "Title 2"]
2. Do not include any explanation or markdown formatting (like \`\`\`json).
3. Ensure titles are catchy but not clickbaity.
4. Keep length between 40-70 characters.`;

    return prompt;
  }
}

export const promptService = new PromptService();
