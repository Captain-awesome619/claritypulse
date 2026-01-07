import { NextResponse } from "next/server";
import { CohereClientV2 } from "cohere-ai";

const cohere = new CohereClientV2({
  token: process.env.COHERE_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { analytics } = await req.json();

    if (!analytics) {
      return NextResponse.json(
        { error: "Missing analytics payload" },
        { status: 400 }
      );
    }

    const prompt = `
You are an analytics insight assistant for a product called ClarityPulse.

Your task:
- Structure the response properly and remove unnecessary symbols like asterisks or dashes
- Analyze the provided analytics data
- Calculate meaningful percentages and ratios
- Reference the date range naturally
- Explain insights in friendly, clear English
- Highlight patterns, trends, and opportunities
- Do NOT invent data
-After each key insight point, leave a space before the next one

Rules:
- Always convert counts into percentages when possible
- Round percentages to whole numbers
- Avoid technical jargon
- make it as engaging and friendly as possible

Analytics data:
${JSON.stringify(analytics, null, 2)}

Response format:
- 2 sentence summary
- 3-5 bullet points with percentage-based insights
`;

    // 👇 MATCHES YOUR WORKING PATTERN
    const response = await cohere.chat({
      model: "command-a-03-2025",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // response.message = latest assistant reply
    return NextResponse.json({
      insight: response.message,
    });
  } catch (error) {
    console.error("Cohere API Error:", error);

    return NextResponse.json(
      { error: "Cohere API request failed" },
      { status: 500 }
    );
  }
}
