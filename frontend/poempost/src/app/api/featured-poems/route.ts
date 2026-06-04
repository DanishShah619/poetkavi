import { NextRequest, NextResponse } from "next/server";

import { adminDb } from "@/lib/firebase-admin";

type FeaturedPoem = {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
};

const DEFAULT_AUTHOR = "shanildanshah";
const DEFAULT_LIMIT = 3;
const MAX_LIMIT = 6;

function clampLimit(value: string | null) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return DEFAULT_LIMIT;
  }

  return Math.min(parsed, MAX_LIMIT);
}

function toFeaturedPoem(id: string, data: FirebaseFirestore.DocumentData): FeaturedPoem {
  return {
    id,
    title: typeof data.title === "string" && data.title.trim() ? data.title : "Untitled Poem",
    content: typeof data.content === "string" ? data.content : "",
    imageUrl: typeof data.imageUrl === "string" && data.imageUrl.trim() ? data.imageUrl : null,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const author = searchParams.get("author")?.trim() || DEFAULT_AUTHOR;
  const poemLimit = clampLimit(searchParams.get("limit"));

  try {
    const snapshot = await adminDb
      .collection("poems")
      .where("authorName", "==", author)
      .orderBy("createdAt", "desc")
      .limit(poemLimit)
      .get();

    const poems = snapshot.docs.map((doc) => toFeaturedPoem(doc.id, doc.data()));

    return NextResponse.json({ poems }, { status: 200 });
  } catch (error) {
    console.error("[featured-poems] Failed to load featured poems:", error);

    return NextResponse.json(
      { error: "Featured poems are temporarily unavailable." },
      { status: 500 }
    );
  }
}
