"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/ui/Navbar";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { CollaborationProvider } from "@/components/explore/CollaborationProvider";
import { useOthers } from "@liveblocks/react";
import { 
  Users, 
  UserCheck, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  BookOpen, 
  Edit, 
  ArrowLeft,
  CircleDot
} from "lucide-react";
import { cn } from "@/lib/utils";

// Load CollaborativeEditor with SSR disabled to prevent hydration issues
const CollaborativeEditor = dynamic(
  () => import("@/components/explore/CollaborativeEditor").then((m) => m.CollaborativeEditor),
  { ssr: false }
);

interface PoemData {
  id: string;
  title?: string;
  content?: string;
  authorId: string;
  authorName?: string;
  authorEmail?: string;
  imageUrl?: string;
  allowedEditors?: string[];
  allowedViewers?: string[];
  allowedEditorsEmails?: string[];
  allowedViewersEmails?: string[];
}

interface PageProps {
  params: Promise<{ poemId: string }>;
}

export default function CollaboratePage({ params }: PageProps) {
  // Await the asynchronous route params in Next.js 15
  const { poemId } = use(params);

  const { currentUser: user, loading: authLoading, logOut } = useAuth();
  const router = useRouter();

  const [poem, setPoem] = useState<PoemData | null>(null);
  const [loadingPoem, setLoadingPoem] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite states
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");
  const [inviteLoading, setInviteLoading] = useState(false);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin");
    }
  }, [authLoading, user, router]);

  // Sync poem data from Firestore in real-time
  useEffect(() => {
    if (!user || !poemId) return;

    const docRef = doc(db, "poems", poemId);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          setError("This poem does not exist or has been deleted.");
          setLoadingPoem(false);
          return;
        }

        const data = docSnap.data();
        
        // Client-side early permission check
        const isOwner = data.authorId === user.uid;
        const isAllowedEditor = data.allowedEditors?.includes(user.uid) || data.allowedEditorsEmails?.includes(user.email);
        const isAllowedViewer = data.allowedViewers?.includes(user.uid) || data.allowedViewersEmails?.includes(user.email);

        if (!isOwner && !isAllowedEditor && !isAllowedViewer) {
          setError("Forbidden: You do not have permission to collaborate on this poem.");
          setLoadingPoem(false);
          return;
        }

        setPoem({ id: docSnap.id, ...data } as PoemData);
        setLoadingPoem(false);
      },
      (err) => {
        console.error("Firestore snapshot error:", err);
        setError("Failed to load poem. Please check your permissions.");
        setLoadingPoem(false);
      }
    );

    return () => unsubscribe();
  }, [user, poemId]);

  // Handle autosave checkpoint write
  const handleSaveCheckpoint = async (htmlContent: string) => {
    if (!poemId) return;
    try {
      const docRef = doc(db, "poems", poemId);
      await updateDoc(docRef, {
        content: htmlContent,
      });
    } catch (err) {
      console.error("Error saving checkpoint to Firestore:", err);
    }
  };

  // Handle invitation
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || inviteLoading || !poem) return;

    setInviteLoading(true);
    const cleanEmail = inviteEmail.trim().toLowerCase();
    const docRef = doc(db, "poems", poem.id);

    try {
      if (inviteRole === "editor") {
        await updateDoc(docRef, {
          allowedEditorsEmails: arrayUnion(cleanEmail),
          // Clean up from viewers if upgrading
          allowedViewersEmails: arrayRemove(cleanEmail)
        });
      } else {
        await updateDoc(docRef, {
          allowedViewersEmails: arrayUnion(cleanEmail),
          // Clean up from editors if downgrading
          allowedEditorsEmails: arrayRemove(cleanEmail)
        });
      }
      setInviteEmail("");
    } catch (err) {
      console.error("Invitation failed:", err);
      alert("Failed to send invitation. Please verify permissions.");
    } finally {
      setInviteLoading(false);
    }
  };

  // Revoke collaborator access
  const handleRevoke = async (email: string, role: "editor" | "viewer") => {
    if (!poem) return;
    const docRef = doc(db, "poems", poem.id);

    try {
      if (role === "editor") {
        await updateDoc(docRef, {
          allowedEditorsEmails: arrayRemove(email)
        });
      } else {
        await updateDoc(docRef, {
          allowedViewersEmails: arrayRemove(email)
        });
      }
    } catch (err) {
      console.error("Revoke access failed:", err);
    }
  };

  if (authLoading || loadingPoem) {
    return (
      <div className="relative min-h-screen w-full bg-black flex items-center justify-center">
        <div className="text-white text-lg animate-pulse flex items-center gap-2">
          <CircleDot className="animate-spin text-indigo-500" />
          Loading collaborative session...
        </div>
      </div>
    );
  }

  if (error || !poem) {
    return (
      <div className="relative min-h-screen w-full bg-black flex items-center justify-center p-4 text-center">
        <div className="max-w-md p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Access Denied</h2>
          <p className="text-neutral-400">{error || "Something went wrong."}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isOwner = poem.authorId === user?.uid;
  const isAllowedEditor = isOwner || poem.allowedEditors?.includes(user?.uid ?? "") || poem.allowedEditorsEmails?.includes(user?.email ?? "");

  return (
    <div className="relative min-h-screen w-full bg-black/[0.96] antialiased">
      {/* Background Grid */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-0 [background-size:40px_40px] select-none",
          "[background-image:linear-gradient(to_right,#171717_1px,transparent_1px),linear-gradient(to_bottom,#171717_1px,transparent_1px)]"
        )}
      />

      <Navbar
        userEmail={user?.email || ""}
        userPhoto={user?.photoURL || ""}
        onLogout={logOut}
      />
      <div className="pt-24" />

      <CollaborationProvider roomId={`poem_${poem.id}`}>
        <div className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8 pb-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Workspace Column */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Session Header */}
            <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="text-neutral-400 hover:text-white transition-colors text-sm flex items-center gap-1.5 mb-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                  {poem.title || "Untitled Poem"}
                  <span className="px-2 py-0.5 text-xs rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-normal">
                    Live Collaboration
                  </span>
                </h1>
                <p className="text-sm text-neutral-400">
                  Created by <span className="text-neutral-300 font-semibold">{poem.authorName || "Anonymous"}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <ActiveUsersList />
              </div>
            </div>

            {/* Editor Area */}
            <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/80 overflow-hidden shadow-2xl p-2">
              {isAllowedEditor ? (
                <CollaborativeEditor
                  initialContent={poem.content || ""}
                  onSaveCheckpoint={handleSaveCheckpoint}
                />
              ) : (
                <div className="p-8 text-center text-neutral-400 space-y-4">
                  <BookOpen className="w-12 h-12 text-indigo-500 mx-auto" />
                  <h3 className="text-lg font-semibold text-white">Read-Only Workspace</h3>
                  <p className="max-w-md mx-auto text-sm">
                    You have read-only access. You can view updates in real-time as editors compose content.
                  </p>
                  {/* Read-Only text rendering fallback or disabled Tiptap content */}
                  <div className="border border-neutral-800 rounded-xl p-6 bg-neutral-900 text-left text-neutral-300 font-serif whitespace-pre-wrap">
                    {poem.content || "No content written yet."}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Collaboration Sidebar Column */}
          <div className="space-y-6">
            
            {/* Active presence listing */}
            <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 backdrop-blur-xl space-y-4">
              <h2 className="text-sm font-semibold text-white tracking-wider uppercase flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Collaborator Rules
              </h2>
              <div className="text-xs text-neutral-400 space-y-2">
                <p className="flex items-center gap-2">
                  <Edit className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span><strong>Editors</strong> can write, delete, format, and undo/redo live edits.</span>
                </p>
                <p className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span><strong>Viewers</strong> see changes update dynamically in read-only mode.</span>
                </p>
              </div>
            </div>

            {/* Invite Collaborator Panel (Only available to the document owner) */}
            <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 backdrop-blur-xl space-y-4">
              <h2 className="text-sm font-semibold text-white tracking-wider uppercase flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-400" />
                Manage Collaborators
              </h2>

              {isOwner ? (
                <>
                  <form onSubmit={handleInvite} className="space-y-3">
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Invitee Email</label>
                      <input
                        type="email"
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="collaborator@example.com"
                        className="w-full px-3 py-2 text-sm rounded bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Role</label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as "editor" | "viewer")}
                        className="w-full px-3 py-2 text-sm rounded bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="editor">Editor (Can edit)</option>
                        <option value="viewer">Viewer (Read-only)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={inviteLoading}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded font-medium text-xs transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Invite User
                    </button>
                  </form>

                  {/* List of current invitees */}
                  <div className="pt-2 border-t border-neutral-800 space-y-3">
                    <h3 className="text-xs font-semibold text-neutral-300">Active Invitations</h3>
                    
                    {/* Editors list */}
                    {poem.allowedEditorsEmails && poem.allowedEditorsEmails.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Editors</div>
                        {poem.allowedEditorsEmails.map((email: string) => (
                          <div key={email} className="flex items-center justify-between text-xs bg-neutral-950 p-2 rounded border border-neutral-800">
                            <span className="truncate max-w-[120px] text-neutral-300" title={email}>{email}</span>
                            <button
                              onClick={() => handleRevoke(email, "editor")}
                              className="text-neutral-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Viewers list */}
                    {poem.allowedViewersEmails && poem.allowedViewersEmails.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Viewers</div>
                        {poem.allowedViewersEmails.map((email: string) => (
                          <div key={email} className="flex items-center justify-between text-xs bg-neutral-950 p-2 rounded border border-neutral-800">
                            <span className="truncate max-w-[120px] text-neutral-300" title={email}>{email}</span>
                            <button
                              onClick={() => handleRevoke(email, "viewer")}
                              className="text-neutral-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {(!poem.allowedEditorsEmails?.length && !poem.allowedViewersEmails?.length) && (
                      <div className="text-xs text-neutral-500 italic text-center py-2">
                        No collaborators invited yet.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-xs text-neutral-400 space-y-2">
                  <p>Only the owner of this poem can invite and manage collaborators.</p>
                  <p className="text-[10px] text-neutral-500 pt-2 border-t border-neutral-800">
                    If you require editor permissions, contact the author (<strong className="text-neutral-300">{poem.authorEmail}</strong>).
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </CollaborationProvider>
    </div>
  );
}

// Subcomponent to list currently active online users in the room
function ActiveUsersList() {
  const others = useOthers();

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex -space-x-2 overflow-hidden mr-1">
        {others.map((other) => {
          const color = getRandomColor(other.id ?? "");
          const initial = other.info?.name ? other.info.name.charAt(0).toUpperCase() : "?";
          return (
            <div
              key={other.id}
              style={{ borderColor: "#171717", backgroundColor: color }}
              className="inline-block h-7 w-7 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white"
              title={other.info?.name || "Collaborator"}
            >
              {initial}
            </div>
          );
        })}
      </div>
      <span className="text-xs text-neutral-400">
        {others.length === 0 
          ? "No other writers online" 
          : `${others.length} other ${others.length === 1 ? "writer" : "writers"} online`}
      </span>
    </div>
  );
}

function getRandomColor(id: string) {
  const colors = [
    "#f87171",
    "#fb923c",
    "#fbbf24",
    "#34d399",
    "#60a5fa",
    "#818cf8",
    "#c084fc",
  ];
  const index =
    Math.abs(
      id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    ) % colors.length;
  return colors[index];
}
