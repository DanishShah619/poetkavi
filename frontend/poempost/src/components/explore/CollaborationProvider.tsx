"use client";

import { LiveblocksProvider, RoomProvider } from "@liveblocks/react";
import React from "react";
import { auth } from "@/lib/firebase";

interface CollaborationProviderProps {
  children: React.ReactNode;
  roomId: string;
}

export function CollaborationProvider({
  children,
  roomId,
}: CollaborationProviderProps) {
  return (
    <LiveblocksProvider
      authEndpoint={async (room) => {
        // Dynamically get the current user's active ID token.
        // Firebase automatically handles internal token refresh checks.
        const token = await auth.currentUser?.getIdToken(false);
        if (!token) {
          throw new Error("Cannot authenticate: No active Firebase session found.");
        }

        const response = await fetch("/api/liveblocks-auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ room }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to authenticate room access: ${response.status}`);
        }

        return await response.json();
      }}
    >
      <RoomProvider id={roomId} initialPresence={{}}>
        {children}
      </RoomProvider>
    </LiveblocksProvider>
  );
}
