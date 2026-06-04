import { NextRequest, NextResponse } from "next/server";

import { adminAuth, adminDb } from "@/lib/firebase-admin";

type RouteContext = {
  params: Promise<{
    poemId: string;
  }>;
};

function getAuthorDisplay(data: FirebaseFirestore.DocumentData) {
  return (
    (typeof data.authorName === "string" && data.authorName) ||
    (typeof data.authorEmail === "string" ? data.authorEmail.split("@")[0] : "") ||
    "Poet"
  );
}

export async function GET(request: NextRequest, context: RouteContext) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split("Bearer ")[1];

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [{ poemId }] = await Promise.all([
      context.params,
      adminAuth.verifyIdToken(token),
    ]);

    if (!poemId) {
      return NextResponse.json({ error: "Poem id is required." }, { status: 400 });
    }

    const snapshot = await adminDb.collection("poems").doc(poemId).get();

    if (!snapshot.exists) {
      return NextResponse.json({ error: "Poem not found." }, { status: 404 });
    }

    const data = snapshot.data() ?? {};

    return NextResponse.json(
      {
        poem: {
          id: snapshot.id,
          title: typeof data.title === "string" ? data.title : "Untitled Poem",
          content: typeof data.content === "string" ? data.content : "",
          font: typeof data.font === "string" ? data.font : "inter",
          imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : null,
          createdAt: data.createdAt?.toJSON?.() ?? data.createdAt ?? null,
          authorId: typeof data.authorId === "string" ? data.authorId : "",
          authorName: getAuthorDisplay(data),
          authorEmail: typeof data.authorEmail === "string" ? data.authorEmail : "",
          likes: Array.isArray(data.likes) ? data.likes : [],
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[poem-detail] Failed to load poem:", error);
    return NextResponse.json({ error: "Failed to load poem." }, { status: 500 });
  }
}
