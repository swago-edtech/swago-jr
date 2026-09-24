interface SentimentResult {
  isPositive: boolean;
  label: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  confidence: number;
  reasoning?: string; // Why it's positive/negative
}

/**
 * Analyze review sentiment using Gemini
 */
export async function analyzeReviewSentiment(
  title: string,
  comment: string
): Promise<SentimentResult> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `You are a sentiment analysis expert for e-commerce product reviews. Be accurate and consider cultural context.\n\n${prompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 150,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Gemini request failed (${response.status}): ${detail.slice(0, 200)}`);
    }

    const data = await response.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      throw new Error("No response from Gemini");
    }

    const result = JSON.parse(content);

    return {
      isPositive: result.sentiment === "POSITIVE" || result.sentiment === "NEUTRAL",
      label: result.sentiment,
      confidence: result.confidence,
      reasoning: result.reasoning,
    };
  } catch (error) {
    console.error("❌ Gemini sentiment analysis failed:", error);

    // ✅ Fallback: Send to pending on error (safe)
    return {
      isPositive: false, // Send to admin review if API fails
      label: "NEUTRAL",
      confidence: 0,
      reasoning: "API error - manual review required",
    };
  }
}
