import OpenAI from "openai";

interface SentimentResult {
  isPositive: boolean;
  label: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  confidence: number;
  reasoning?: string; // Why it's positive/negative
}

/**
 * Analyze review sentiment using GPT-4o-mini
 * Cost: ~$0.00006 per review (6/100th of a cent)
 */
export async function analyzeReviewSentiment(
  title: string,
  comment: string
): Promise<SentimentResult> {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `Analyze the sentiment of this product review. Return ONLY a JSON object with this exact format:
{
  "sentiment": "POSITIVE" | "NEGATIVE" | "NEUTRAL",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}

Review Title: "${title}"
Review Comment: "${comment}"

Consider:
- Sarcasm and irony
- Mixed feelings (choose dominant sentiment)
- Indian English and Hinglish phrases
- Context and nuance

Be strict: only mark as POSITIVE if genuinely satisfied, NEGATIVE if genuinely dissatisfied.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a sentiment analysis expert for e-commerce product reviews. Be accurate and consider cultural context.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower = more consistent
      max_tokens: 150,
      response_format: { type: "json_object" }, // Force JSON response
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response from GPT");
    }

    const result = JSON.parse(content);

    return {
      isPositive: result.sentiment === "POSITIVE" || result.sentiment === "NEUTRAL",
      label: result.sentiment,
      confidence: result.confidence,
      reasoning: result.reasoning,
    };
  } catch (error) {
    console.error("❌ GPT sentiment analysis failed:", error);

    // ✅ Fallback: Send to pending on error (safe)
    return {
      isPositive: false, // Send to admin review if API fails
      label: "NEUTRAL",
      confidence: 0,
      reasoning: "API error - manual review required",
    };
  }
}