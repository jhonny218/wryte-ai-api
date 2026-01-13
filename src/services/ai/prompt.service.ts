import { ContentSettings } from "../../../generated/prisma/client";

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

  generateOutlinePrompt(settings: ContentSettings, title: string, structureHint?: string): string {
    const { primaryKeywords, secondaryKeywords, tone, targetAudience, industry, goals, topicsToAvoid } = settings;

    let prompt = `Generate a detailed article outline for the following blog title:\n\n"${title}"\n\n`;

    if (industry) prompt += `Industry context: ${industry}.\n`;
    if (targetAudience) prompt += `Target audience: ${targetAudience}.\n`;
    if (structureHint) prompt += `Structure hint: ${structureHint}.\n`;

    prompt += `\nConfiguration:\n- Primary Keywords: ${primaryKeywords.join(", ") || "None"}\n- Secondary Keywords: ${secondaryKeywords.join(", ") || "None"}\n- Tone: ${tone || "Professional"}\n- Goals: ${goals.join(", ") || "Engagement"}\n- Topics to Avoid: ${topicsToAvoid.join(", ") || "None"}\n\n`;

    prompt += `Requirements:\n1. Return ONLY a single valid JSON object that matches the schema described below.\n2. Do not include any explanation, bullet lists outside the JSON, or markdown formatting.\n3. The outline should be structured for readers and writers: sections with headings and bullet point subitems.\n4. Keep section headings concise (5-8 words) and bullets short actionable points (max 12 words).\n\n`;

    prompt += `Schema (JSON):\n{\n  "title": string,\n  "metaDescription": string,\n  "seoKeywords": [string],\n  "sections": [\n    {\n      "heading": string,\n      "bullets": [string]\n    }\n  ],\n  "suggestedImages": [string]\n}\n\n`;

    prompt += `Example output:\n{"title":"${title}","metaDescription":"Short desc up to 160 chars...","seoKeywords":["keyword1","keyword2"],"sections":[{"heading":"Intro","bullets":["Hook","Why it matters"]}],"suggestedImages":["hero-image.jpg"]}`;

    return prompt;
  }

  generateBlogPrompt(settings: ContentSettings, title: string, outline: any): string {
    const { primaryKeywords, secondaryKeywords, tone, targetAudience, industry, goals, topicsToAvoid } = settings;

    let prompt = `Write a complete, well-structured blog article based on the following information:\n\n`;
    prompt += `Title: "${title}"\n\n`;

    if (outline) {
      prompt += `Outline:\n${JSON.stringify(outline, null, 2)}\n\n`;
    }

    if (industry) prompt += `Industry context: ${industry}.\n`;
    if (targetAudience) prompt += `Target audience: ${targetAudience}.\n`;

    prompt += `\nConfiguration:\n- Primary Keywords: ${primaryKeywords.join(", ") || "None"}\n- Secondary Keywords: ${secondaryKeywords.join(", ") || "None"}\n- Tone: ${tone || "Professional"}\n- Goals: ${goals.join(", ") || "Engagement"}\n- Topics to Avoid: ${topicsToAvoid.join(", ") || "None"}\n\n`;

    prompt += `Requirements:\n1. Return ONLY a single valid JSON object that matches the schema described below.\n2. Do not include any explanation, notes, or markdown formatting outside the JSON.\n3. Write engaging, informative content that flows naturally and maintains the specified tone.\n4. Incorporate primary and secondary keywords naturally throughout the content.\n5. Each section should have substantial content (3-5 paragraphs minimum per section).\n6. Use proper paragraph breaks and maintain readability.\n\n`;

    prompt += `Schema (JSON):\n{\n  "title": string,\n  "content": string,\n  "wordCount": number,\n  "metaDescription": string,\n  "seoKeywords": [string],\n  "suggestedImages": [string]\n}\n\n`;

    prompt += `Example output:\n{"title":"${title}","content":"<h1>Introduction</h1><p>First paragraph...</p><p>Second paragraph...</p><h2>Section One</h2><p>Content here...</p>","wordCount":1250,"metaDescription":"Brief summary...","seoKeywords":["keyword1","keyword2"],"suggestedImages":["image1.jpg","image2.jpg"]}`;

    return prompt;
  }
}

export const promptService = new PromptService();
