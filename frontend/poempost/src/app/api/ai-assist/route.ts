import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// In-memory rate limiter  (resets on server restart; sufficient for single-
// instance deployments. Swap for Redis/Upstash for multi-instance scale.)
// ---------------------------------------------------------------------------
interface RateEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateEntry>();
const MAX_REQUESTS = 3;          // requests allowed per window
const WINDOW_MS    = 60 * 60 * 1000; // 1 hour window

function isRateLimited(userId: string): { limited: boolean; remaining: number; resetInMs: number } {
  const now  = Date.now();
  const entry = rateLimitStore.get(userId);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    // First request or window expired — open a fresh window
    rateLimitStore.set(userId, { count: 1, windowStart: now });
    return { limited: false, remaining: MAX_REQUESTS - 1, resetInMs: WINDOW_MS };
  }

  if (entry.count >= MAX_REQUESTS) {
    const resetInMs = WINDOW_MS - (now - entry.windowStart);
    return { limited: true, remaining: 0, resetInMs };
  }

  entry.count += 1;
  return { limited: false, remaining: MAX_REQUESTS - entry.count, resetInMs: WINDOW_MS - (now - entry.windowStart) };
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------
function buildPrompt(poemContent: string, keywords: string[]): string {
  const hasContent = poemContent.trim().length > 0;

  return `You are a master poet and creative writing assistant with deep knowledge of world poetry traditions.

${hasContent
  ? `The poet has written the following poem (it may be a draft or complete):
"""
${poemContent.trim()}
"""

Enhance this poem while preserving its core meaning and the poet's voice.`
  : `The poet has not written anything yet. Compose an original poem for them.`}

Apply the following creative directions naturally and beautifully:
Keywords: ${keywords.join(", ")}

Strict rules:
- Return ONLY the poem itself — no title, no explanations, no commentary
- Do not prefix with "Here is the poem:" or similar phrases
- Keep a similar length to the original${hasContent ? "" : " (aim for 10–16 lines)"}
- Let the keywords guide mood, imagery, and rhythm — do not force them
- Write in English`;
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      poemContent?: string;
      keywords?: string[];
      userId?: string;
    };

    const { poemContent = "", keywords = [], userId = "" } = body;

    // Basic validation
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!keywords.length || keywords.length > 4) {
      return NextResponse.json({ error: "Select between 1 and 4 keywords." }, { status: 400 });
    }

    // Rate limiting
    const { limited, remaining, resetInMs } = isRateLimited(userId);
    if (limited) {
      const minutes = Math.ceil(resetInMs / 60000);
      return NextResponse.json(
        { error: `Rate limit reached. You can generate again in ~${minutes} minute${minutes === 1 ? "" : "s"}.` },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(resetInMs / 1000)),
          },
        }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI service is not configured." }, { status: 503 });
    }

    // Call Gemini REST API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(poemContent, keywords) }] }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 1024,
          topP: 0.95,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ],
      }),
    });

    if (!geminiRes.ok) {
      const errData = await geminiRes.json().catch(() => ({}));
      console.error("[ai-assist] Gemini error:", errData);
      return NextResponse.json({ error: "AI generation failed. Please try again." }, { status: 502 });
    }

    const geminiData = await geminiRes.json() as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    const suggestion =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

    if (!suggestion) {
      return NextResponse.json({ error: "AI returned an empty response. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ suggestion, remaining }, { status: 200 });

  } catch (err) {
    console.error("[ai-assist] Unexpected error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
