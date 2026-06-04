import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "@/lib/firebase-admin";

type RouteContext = {
  params: Promise<{
    poemId: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split("Bearer ")[1];

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [{ poemId }, decodedToken] = await Promise.all([
      context.params,
      adminAuth.verifyIdToken(token),
    ]);

    if (!poemId) {
      return NextResponse.json({ error: "Poem id is required." }, { status: 400 });
    }

    const poemRef = adminDb.collection("poems").doc(poemId);
    const result = await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(poemRef);

      if (!snapshot.exists) {
        return null;
      }

      const data = snapshot.data();
      const likes = Array.isArray(data?.likes) ? data.likes : [];
      const isLiked = likes.includes(decodedToken.uid);

      transaction.update(poemRef, {
        likes: isLiked
          ? FieldValue.arrayRemove(decodedToken.uid)
          : FieldValue.arrayUnion(decodedToken.uid),
      });

      return {
        liked: !isLiked,
        likes: isLiked
          ? likes.filter((uid) => uid !== decodedToken.uid)
          : [...likes, decodedToken.uid],
      };
    });

    if (!result) {
      return NextResponse.json({ error: "Poem not found." }, { status: 404 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[poem-like] Failed to toggle like:", error);
    return NextResponse.json({ error: "Failed to update like." }, { status: 500 });
  }
}
