import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const MAX_REQUESTS = 10;
const WINDOW_MS = 60 * 60 * 1000;
type AssistMode = "continue" | "rewrite";

interface RateEntry {
  count: number;
  windowStart: number;
}

async function checkAndIncrementRateLimit(
  userId: string
): Promise<{ limited: boolean; remaining: number; resetInMs: number }> {
  const ref = adminDb.collection("rateLimits").doc(userId);

  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = Date.now();
    const data = snap.data() as RateEntry | undefined;

    if (!data || now - data.windowStart >= WINDOW_MS) {
      tx.set(ref, { count: 1, windowStart: now });
      return { limited: false, remaining: MAX_REQUESTS - 1, resetInMs: WINDOW_MS };
    }

    if (data.count >= MAX_REQUESTS) {
      const resetInMs = WINDOW_MS - (now - data.windowStart);
      return { limited: true, remaining: 0, resetInMs };
    }

    tx.update(ref, { count: FieldValue.increment(1) });
    const newCount = data.count + 1;
    return {
      limited: false,
      remaining: MAX_REQUESTS - newCount,
      resetInMs: WINDOW_MS - (now - data.windowStart),
    };
  });
}

function buildPrompt(poemContent: string, keywords: string[], assistMode: AssistMode): string {
  const trimmedPoem = poemContent.trim();
  const hasContent = trimmedPoem.length > 0;

  if (assistMode === "continue" && hasContent) {
    return `You are a master poet and creative writing assistant with deep knowledge of world poetry traditions.

The poet has written:
"""
${trimmedPoem}
"""

Suggest a continuation for this poem.

Apply the following creative directions naturally and beautifully:
Keywords: ${keywords.join(", ")}

Strict rules:
- Return ONLY the continuation lines, not the full poem
- Do not repeat, rewrite, summarize, or replace the existing poem
- Do not add a title, explanation, commentary, or prefix
- Continue the poet's voice, imagery, rhythm, and emotional direction
- Aim for 4-8 lines unless the existing poem strongly implies a shorter ending
- Write in English`;
  }

  return `You are a master poet and creative writing assistant with deep knowledge of world poetry traditions.

${
  hasContent
    ? `The poet has written the following poem:
"""
${trimmedPoem}
"""

Rewrite this poem while preserving its core meaning and the poet's voice.`
    : "The poet has not written anything yet. Compose an original poem for them."
}

Apply the following creative directions naturally and beautifully:
Keywords: ${keywords.join(", ")}

Strict rules:
- Return ONLY the poem itself, no title, explanations, or commentary
- Do not prefix with "Here is the poem:" or similar phrases
- Keep a similar length to the original${hasContent ? "" : " (aim for 10-16 lines)"}
- Let the keywords guide mood, imagery, and rhythm without forcing them
- Write in English`;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split("Bearer ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userId: string;
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      userId = decoded.uid;
    } catch {
      return NextResponse.json({ error: "Unauthorized: invalid token" }, { status: 401 });
    }

    const body = (await req.json()) as {
      poemContent?: string;
      keywords?: string[];
      assistMode?: AssistMode;
    };

    const { poemContent = "", keywords = [], assistMode = "rewrite" } = body;

    if (assistMode !== "continue" && assistMode !== "rewrite") {
      return NextResponse.json({ error: "Invalid AI assist mode." }, { status: 400 });
    }

    if (!keywords.length || keywords.length > 4) {
      return NextResponse.json({ error: "Select between 1 and 4 keywords." }, { status: 400 });
    }

    if (assistMode === "continue" && !poemContent.trim()) {
      return NextResponse.json(
        { error: "Write a few lines before asking AI to continue your poem." },
        { status: 400 }
      );
    }

    const { limited, remaining, resetInMs } = await checkAndIncrementRateLimit(userId);
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

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(poemContent, keywords, assistMode) }] }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: assistMode === "continue" ? 512 : 1024,
          topP: 0.95,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
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

    const geminiData = (await geminiRes.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    const suggestion = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

    if (!suggestion) {
      return NextResponse.json({ error: "AI returned an empty response. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ suggestion, remaining }, { status: 200 });
  } catch (err) {
    console.error("[ai-assist] Unexpected error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
