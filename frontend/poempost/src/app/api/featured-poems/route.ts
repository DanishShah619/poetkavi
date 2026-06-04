import { NextRequest, NextResponse } from "next/server";

import { adminDb } from "@/lib/firebase-admin";

type FeaturedPoem = {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
};

type SortableFeaturedPoem = FeaturedPoem & {
  createdAtSeconds: number;
};

const DEFAULT_AUTHOR = "Danish Shanil Shah (47)";
const DEFAULT_AUTHOR_EMAIL = "shanildanshah@gmail.com";
const DEFAULT_LIMIT = 3;
const MAX_LIMIT = 6;

function clampLimit(value: string | null) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return DEFAULT_LIMIT;
  }

  return Math.min(parsed, MAX_LIMIT);
}

function toFeaturedPoem(id: string, data: FirebaseFirestore.DocumentData): SortableFeaturedPoem {
  return {
    id,
    title: typeof data.title === "string" && data.title.trim() ? data.title : "Untitled Poem",
    content: typeof data.content === "string" ? data.content : "",
    imageUrl: typeof data.imageUrl === "string" && data.imageUrl.trim() ? data.imageUrl : null,
    createdAtSeconds:
      typeof data.createdAt?.seconds === "number" ? data.createdAt.seconds : 0,
  };
}

function stripSortField(poem: SortableFeaturedPoem): FeaturedPoem {
  return {
    id: poem.id,
    title: poem.title,
    content: poem.content,
    imageUrl: poem.imageUrl,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const author = searchParams.get("author")?.trim() || DEFAULT_AUTHOR;
  const authorEmail = searchParams.get("authorEmail")?.trim() || DEFAULT_AUTHOR_EMAIL;
  const poemLimit = clampLimit(searchParams.get("limit"));

  try {
    const authorNameSnapshot = await adminDb
      .collection("poems")
      .where("authorName", "==", author)
      .orderBy("createdAt", "desc")
      .limit(poemLimit)
      .get();

    const poemsById = new Map<string, SortableFeaturedPoem>();
    authorNameSnapshot.docs.forEach((doc) => {
      poemsById.set(doc.id, toFeaturedPoem(doc.id, doc.data()));
    });

    if (poemsById.size < poemLimit && authorEmail) {
      const authorEmailSnapshot = await adminDb
        .collection("poems")
        .where("authorEmail", "==", authorEmail)
        .get();

      authorEmailSnapshot.docs.forEach((doc) => {
        poemsById.set(doc.id, toFeaturedPoem(doc.id, doc.data()));
      });
    }

    const poems = Array.from(poemsById.values())
      .sort((a, b) => b.createdAtSeconds - a.createdAtSeconds)
      .slice(0, poemLimit)
      .map(stripSortField);

    return NextResponse.json({ poems }, { status: 200 });
  } catch (error) {
    console.error("[featured-poems] Failed to load featured poems:", error);

    return NextResponse.json(
      { error: "Featured poems are temporarily unavailable." },
      { status: 500 }
    );
  }
}
