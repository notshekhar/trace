import Anthropic from "@anthropic-ai/sdk";

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

interface SummaryResult {
  summaryAi: string;
  keyTakeaways: string; // JSON array string: ["point1", "point2", "point3"]
}

export async function summarizeArticle(
  title: string,
  summary?: string
): Promise<SummaryResult | undefined> {
  if (!client || !summary) return undefined;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `Given this news article title and excerpt, provide:
1. A 2-3 sentence summary paragraph
2. Exactly 3 key takeaways as a JSON array

Title: ${title}
Excerpt: ${summary}

Respond in this exact JSON format:
{"summary": "...", "takeaways": ["point 1", "point 2", "point 3"]}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return undefined;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.summary || !Array.isArray(parsed.takeaways)) return undefined;

    return {
      summaryAi: parsed.summary,
      keyTakeaways: JSON.stringify(parsed.takeaways.slice(0, 3)),
    };
  } catch {
    return undefined;
  }
}
