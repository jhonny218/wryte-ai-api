import { ContentSettings } from "../../../generated/prisma/client";

export class PromptService {
  generateTitlePrompt(settings: ContentSettings, amount: number, currentMonth?: string): string {
    const {
      primaryKeywords = [],
      secondaryKeywords = [],
      tone,
      targetAudience,
      industry,
      goals = [],
      competitorUrls = [],
      topicsToAvoid = [],
      preferredLength,
    } = settings;

    const primary = primaryKeywords.length ? primaryKeywords.join(", ") : "None";
    const secondary = secondaryKeywords.length ? secondaryKeywords.join(", ") : "None";
    const goalsText = goals.length ? goals.join(", ") : "Engagement and education";
    const avoidText = topicsToAvoid.length ? topicsToAvoid.join(", ") : "None explicitly specified";
    const competitorsText = competitorUrls.length ? competitorUrls.join(", ") : "None specified";
    const toneText = tone || "warm, expert, and trustworthy";
    const audienceText = targetAudience || "a broad, wellness-interested audience";
    const industryText = industry || "content and education";

    let lengthGuidance = "Keep each title between 40–70 characters.";
    if (preferredLength === "SHORT_FORM") {
      lengthGuidance = "Keep each title concise, ideally between 30–55 characters.";
    } else if (preferredLength === "LONG_FORM") {
      lengthGuidance = "Allow slightly longer, descriptive titles, ideally between 50–80 characters.";
    }

    let seasonalContext = "";
    if (currentMonth) {
      seasonalContext = `These titles will be created and/or published around ${currentMonth}, so you may lightly reference seasonal themes when it makes sense, but do not force seasonality into every title.\n`;
    }

    const prompt = `
  You are an expert senior content strategist and professional blog copywriter.

  Task:
  Generate ${amount} unique, catchy, and SEO-aware blog post titles for the ${industryText} space, written in a ${toneText} tone, targeting ${audienceText}. Each title should feel like something a top-tier content team would proudly publish.

  Context & Strategy:
  - Primary keywords (prioritize these naturally when relevant): ${primary}
  - Secondary keywords (use to enrich variety and specificity): ${secondary}
  - Campaign goals: ${goalsText}
  - Topics to avoid: ${avoidText}
  - Competitor and inspiration URLs (ensure you do NOT copy or closely mimic known titles or structures from these): ${competitorsText}
  ${seasonalContext.trim() ? seasonalContext : ""}

  Style & Quality Requirements:
  1. Titles MUST be original, non-generic, and non-repetitive. Each one should feel like a distinct angle or story, not a small variation of another.
  2. Avoid clickbait or over-sensationalized phrasing (no “You won’t believe…”, “shocking”, etc.), but still keep every title emotionally appealing and curiosity-driven.
  3. Blend strategic structure types across the list (for example: how-to guides, step-by-step frameworks, myth-busting, listicles, quiet authority statements, and practical “for beginners” guides).
  4. Naturally weave in primary and secondary keywords where they fit. Do NOT stuff keywords.
  5. Avoid any topics that conflict with the “topics to avoid” list.
  6. ${lengthGuidance}
  7. Write in clear, natural, human-sounding English that aligns with the specified tone: ${toneText}.
  8. Do NOT reference competitors directly in the titles.
  9. Do NOT include numbering or prefixes like “1.”, “Title 1:”, etc. Just the raw titles.

  Output format (very important):
  1. Return ONLY a valid JSON array of strings.
    Example: ["Title 1", "Title 2", "Title 3"]
  2. Do NOT include any explanation, comments, or extra text.
  3. Do NOT include markdown formatting (no backticks, no \`\`\`json).
  `.trim();

    return prompt;
  }

  generateOutlinePrompt(
    settings: ContentSettings,
    title: string,
    structureHint?: string
  ): string {
    const {
      primaryKeywords = [],
      secondaryKeywords = [],
      tone,
      targetAudience,
      industry,
      goals = [],
      competitorUrls = [],
      topicsToAvoid = [],
      preferredLength,
    } = settings;

    const primary = primaryKeywords.length ? primaryKeywords.join(", ") : "None";
    const secondary = secondaryKeywords.length ? secondaryKeywords.join(", ") : "None";
    const goalsText = goals.length ? goals.join(", ") : "Education and engagement";
    const avoidText = topicsToAvoid.length ? topicsToAvoid.join(", ") : "None explicitly specified";
    const competitorsText = competitorUrls.length ? competitorUrls.join(", ") : "None specified";
    const toneText = tone || "warm, expert, and trustworthy";
    const audienceText = targetAudience || "a broad, content-interested audience";
    const industryText = industry || "content and education";

    let lengthGuidance =
      "Plan for a medium-to-long form article (1200–2000 words) with enough depth to be genuinely useful.";
    if (preferredLength === "SHORT_FORM") {
      lengthGuidance =
        "Plan for a concise, high-impact article (800–1200 words) that still feels complete.";
    } else if (preferredLength === "LONG_FORM") {
      lengthGuidance =
        "Plan for a comprehensive, in-depth article (1800–2500 words) with strong educational value.";
    }

    const structureHintText = structureHint
      ? `\nStructure hint (respect this as a soft guide, not a hard constraint): ${structureHint}`
      : "";

    const prompt = `
  You are an expert senior content strategist and professional blog writer.

  Task:
  Create a detailed, writer-ready article outline for the following blog title:
  "${title}"

  The outline will be used by both AI and human writers to draft a complete, high-quality blog post.

  Context:
  - Industry / domain: ${industryText}
  - Target audience: ${audienceText}
  - Tone: ${toneText}
  - Primary keywords (prioritize naturally in the most important sections): ${primary}
  - Secondary keywords (use for variety and depth where relevant): ${secondary}
  - Campaign goals: ${goalsText}
  - Topics to avoid: ${avoidText}
  - Competitor / inspiration URLs (DO NOT copy titles, headings, or structures from these): ${competitorsText}
  - Length guidance: ${lengthGuidance}${structureHintText}

  Outline Philosophy:
  - The outline should tell a clear, logical story from problem → understanding → guidance → resolution.
  - Each major section should have a distinct purpose and angle, not just a rephrased version of another section.
  - The structure must make it easy for a writer to expand into a complete article without guessing the intent.
  - Incorporate primary and secondary keywords where they fit naturally; avoid keyword stuffing.
  - The content should align with the specified tone and audience (e.g., beginner-friendly vs. advanced, practical vs. more reflective).

  JSON Schema (you MUST follow this structure exactly):

  {
    "title": string,                    // Refined version of the given title (optional small improvements)
    "seoKeywords": string[],            // 5–12 focused SEO keywords/phrases for this specific article
    "metaDescription": string,          // Compelling SEO meta description (max ~160 characters)
    "suggestedImages": string[]         // 3–7 descriptive ideas for images or illustrations that would visually support key sections
    "structure": {
      "introduction": {
        "summary": string,             // 2–3 sentences summarizing the hook and what the reader will gain
        "keyPoints": string[]          // 3–5 short bullets outlining what will be covered
      },
      "sections": [
        {
          "heading": string,           // Clear H2-level heading (5–10 words)
          "subheadings": string[],     // 2–5 H3-level subheadings for this section
          "points": string[]           // 4–8 short, actionable bullet points guiding the content under this section
        }
        // 3–7 such section objects total
      ],
      "conclusion": {
        "summary": string,             // 2–3 sentences that recap and reinforce the main transformation/value
        "cta": string                  // A single clear call-to-action aligned with the goals (e.g., read more, try a program, reflect, download, etc.)
      }
    },
  }

  Detailed Requirements:
  1. The "metaDescription" must be compelling, natural, and optimized for clicks without being clickbait. Max ~160 characters.
  2. "seoKeywords" should be specific to this article’s angle, not just a copy of the generic primary/secondary keyword lists.
  3. "introduction.summary" must clearly articulate who this article is for, what problem it addresses, and what outcome or transformation the reader can expect.
  4. "introduction.keyPoints" should map directly to the major value promises of the article (not generic filler).
  5. The "sections" array should contain 3–7 major sections, each with:
    - A unique, meaningful "heading" that moves the narrative forward.
    - "subheadings" that break down the section into logical subsections.
    - "points" that give concrete guidance or content notes, not vague statements. Each point should be max ~15 words.
  6. Ensure the overall flow feels intentional:
    - Early sections: context, foundations, definitions.
    - Middle sections: frameworks, how-tos, examples, or step-by-step guidance.
    - Later sections: integration, practical application, reflection, or advanced tips.
  7. The "conclusion.cta" must align with the goals: ${goalsText}.
  8. Avoid any content or angles that conflict with "topics to avoid": ${avoidText}.
  9. "suggestedImages" should be descriptive ideas (e.g., "calm morning self-care ritual scene"), not URLs. Make sure they match the sections and target audience.
  10. Write everything in clear, natural, human-sounding English that aligns with the tone: ${toneText}.

  Output Format (critical):
  1. Return ONLY a single valid JSON object matching the schema above.
  2. Do NOT include any explanation, comments, or additional text before or after the JSON.
  3. Do NOT include markdown formatting (no backticks, no \`\`\`json).
  `.trim();

    return prompt;
  }

  generateBlogPrompt(
    settings: ContentSettings,
    title: string,
    outline: any
  ): string {
    const {
      primaryKeywords = [],
      secondaryKeywords = [],
      tone,
      targetAudience,
      industry,
      goals = [],
      competitorUrls = [],
      topicsToAvoid = [],
      preferredLength,
    } = settings;

    const primary = primaryKeywords.length ? primaryKeywords.join(", ") : "None";
    const secondary = secondaryKeywords.length ? secondaryKeywords.join(", ") : "None";
    const goalsText = goals.length ? goals.join(", ") : "Education, engagement, and trust-building";
    const avoidText = topicsToAvoid.length ? topicsToAvoid.join(", ") : "None explicitly specified";
    const competitorsText = competitorUrls.length ? competitorUrls.join(", ") : "None specified";
    const toneText = tone || "warm, expert, and trustworthy";
    const audienceText = targetAudience || "a broad, content-interested audience";
    const industryText = industry || "content and education";

    let lengthGuidance =
      "Aim for a substantial, high-quality article around 1,500–2,200 words that feels complete and satisfying to the reader.";
    if (preferredLength === "SHORT_FORM") {
      lengthGuidance =
        "Aim for a focused, concise article around 900–1,300 words that still feels complete and valuable.";
    } else if (preferredLength === "LONG_FORM") {
      lengthGuidance =
        "Aim for a comprehensive, in-depth article around 2,000–2,800 words with strong educational and practical value.";
    }

    const outlineText = outline
      ? `Below is the structured outline JSON you MUST follow as the backbone of the article. You may refine phrasing slightly, but do not change the intent or major structure:

  ${JSON.stringify(outline, null, 2)}

  `
      : "No explicit outline was provided. You must still structure the article logically with an introduction, clear sections, and a conclusion.\n\n";

    const prompt = `
  You are an expert senior content strategist and professional long-form blog writer.

  Task:
  Write a complete, well-structured blog article based on the given title and outline. The final piece should be publish-ready, SEO-aware, and deeply valuable to the target audience.

  Title:
  "${title}"

  ${outlineText}Context:
  - Industry / domain: ${industryText}
  - Target audience: ${audienceText}
  - Tone: ${toneText}
  - Primary keywords (prioritize these naturally where appropriate): ${primary}
  - Secondary keywords (use to enrich specificity and variety): ${secondary}
  - Campaign goals: ${goalsText}
  - Topics to avoid: ${avoidText}
  - Competitor / inspiration URLs (DO NOT copy their wording, examples, or structures): ${competitorsText}
  - Length guidance: ${lengthGuidance}

  Writing Guidelines:
  1. Closely follow the provided outline's structure (introduction → sections → conclusion). Treat each section and subheading as a clear content contract with the reader.
  2. Write in natural, human-sounding, and engaging language that aligns with the tone: ${toneText}.
  3. Assume the reader is intelligent but may not be an expert. Explain concepts clearly without being condescending or overly academic.
  4. Use Markdown formatting for structure:
    - Use "# " for the main title (once).
    - Use "## " for major sections.
    - Use "### " for subheadings where it makes sense.
    - Use bullet lists and numbered lists sparingly, only when they add clarity.
  5. Integrate primary and secondary keywords naturally throughout the article, especially in:
    - The introduction
    - Section headings and subheadings (where appropriate)
    - First sentences of key paragraphs
    Avoid keyword stuffing or awkward phrasing.
  6. Ensure the introduction:
    - Hooks the reader emotionally or intellectually.
    - Clearly states what the article is about.
    - Explains what the reader will gain or how they’ll feel after reading.
  7. For each major section:
    - Start with 1–2 sentences that frame why this section matters.
    - Then expand into 3–5 paragraphs that provide depth, examples, and practical guidance.
    - Use transitions to maintain flow between sections.
  8. The conclusion should:
    - Summarize the key ideas without repeating entire paragraphs.
    - Reconnect to the reader’s initial problem or desire.
    - Offer an encouraging, empathetic closing.
    - Include a clear, natural call-to-action aligned with the goals: ${goalsText}.
  9. Respect "topics to avoid": ${avoidText}. If in doubt, stay on the safe, educational, and supportive side.
  10. Avoid:
      - Clickbait language.
      - Overly salesy copy.
      - Overly technical jargon without explanation.
      - Repeating the same sentence structures or phrases excessively.

  SEO & Metadata:
  - The article should feel written for humans first, but be structurally friendly to search engines.
  - Use headings and subheadings to logically segment concepts.
  - Naturally weave in keywords where they fit; do not force them.

  JSON Output Schema (you MUST follow this exactly):

  {
    "title": string,             // You may subtly refine the original title to improve clarity or impact, but keep the same core angle.
    "content": string,           // The full blog article in Markdown format.
    "wordCount": number,         // Approximate word count of the article content.
  }

  Additional Field Requirements:
  1. "content":
    - MUST be valid Markdown.
    - MUST include a single H1 as the article title at the top.
    - MUST include multiple H2/H3 sections matching the outline’s intent.
    - Paragraphs should be separated by blank lines for readability.

  Output Format (critical):
  1. Return ONLY a single valid JSON object that matches the schema above.
  2. Do NOT include any explanation, comments, or additional text before or after the JSON.
  3. Do NOT include markdown code fences (no backticks, no \`\`\`json).
  `.trim();

    return prompt;
  }
}

export const promptService = new PromptService();
