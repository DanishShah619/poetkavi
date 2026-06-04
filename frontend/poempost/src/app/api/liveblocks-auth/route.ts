import { NextResponse } from "next/server";
import { Liveblocks } from "@liveblocks/node";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY || "sk_prod_placeholder_key",
});

export async function POST(request: Request) {
  // 1. Get user session token from authorization header
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split("Bearer ")[1];
  if (!token) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized: Missing token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // 2. Decode the Firebase ID token securely
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // 3. Get the room ID requested by client
    const { room } = await request.json();
    if (!room || typeof room !== "string" || !room.startsWith("poem_")) {
      return new NextResponse(JSON.stringify({ error: "Bad Request: Invalid room format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const poemId = room.replace("poem_", "");

    // 4. Retrieve poem metadata from Firestore securely on server side
    const poemDoc = await adminDb.collection("poems").doc(poemId).get();
    if (!poemDoc.exists) {
      return new NextResponse(JSON.stringify({ error: "Not Found: Poem does not exist" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const poemData = poemDoc.data();

    // Check user relationship to the document by UID or by email
    const isOwner = poemData?.authorId === userId;
    
    const isEditor = 
      (poemData?.allowedEditors && Array.isArray(poemData.allowedEditors) && poemData.allowedEditors.includes(userId)) ||
      (poemData?.allowedEditorsEmails && Array.isArray(poemData.allowedEditorsEmails) && decodedToken.email && poemData.allowedEditorsEmails.includes(decodedToken.email));
      
    const isViewer = 
      (poemData?.allowedViewers && Array.isArray(poemData.allowedViewers) && poemData.allowedViewers.includes(userId)) ||
      (poemData?.allowedViewersEmails && Array.isArray(poemData.allowedViewersEmails) && decodedToken.email && poemData.allowedViewersEmails.includes(decodedToken.email));

    // 5. Start secure Liveblocks session with specific user details
    const session = liveblocks.prepareSession(userId, {
      userInfo: {
        name: decodedToken.name || decodedToken.email?.split("@")[0] || "Anonymous",
        avatar: decodedToken.picture || "",
      },
    });

    // Determine access permissions using session's typed readonly tuple constants.
    // session.FULL_ACCESS = readonly ["room:write"]
    // session.READ_ACCESS = readonly ["room:read", "room:presence:write"]
    // These satisfy the `readonly Permission[]` parameter of session.allow().
    if (isOwner || isEditor) {
      session.allow(room, session.FULL_ACCESS);
    } else if (isViewer) {
      session.allow(room, session.READ_ACCESS);
    } else {
      // Deny access if they are neither the owner, an editor, nor a viewer
      return new NextResponse(JSON.stringify({ error: "Forbidden: You do not have permission to collaborate on this poem" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { status, body } = await session.authorize();
    return new NextResponse(body, { 
      status,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Liveblocks auth API route error:", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
