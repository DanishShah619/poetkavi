"use client";

import React, { Suspense, useEffect, useState, useRef } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import Navbar from "@/components/ui/Navbar";
import { Meteors } from "@/components/ui/meteors";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useDebounce } from "@/hooks/useDebounce";
import { Poem, useInfiniteFeed } from "@/hooks/useInfiniteFeed";
import { PoemFeedCard } from "@/components/explore/PoemFeedCard";
import { PoemCardSkeleton } from "@/components/explore/PoemCardSkeleton";
import { Calendar, Filter, Heart, MessageCircle, Search, Send, User as UserIcon, X } from "lucide-react";

interface Comment {
  id: string;
  text: string;
  authorEmail: string | null;
  authorId: string;
  createdAt: Timestamp | null;
  poemId: string;
}

const getAuthorDisplay = (poem: Poem) =>
  poem.authorName || poem.authorEmail?.split("@")[0] || "Poet";

const formatPoemDate = (seconds: number | undefined) => {
  if (seconds === undefined) return "";

  return new Date(seconds * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatCommentDate = (comment: Comment) => {
  if (!comment.createdAt) return "";
  return comment.createdAt.toDate().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const ExplorePageContent: React.FC = () => {
  const { currentUser: user, loading: authLoading, logOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const targetPoemId = searchParams.get("poemId");

  const [searchTerm, setSearchTerm] = useState("");
  const [fontFilter, setFontFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedPoem, setSelectedPoem] = useState<Poem | null>(null);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [newComment, setNewComment] = useState("");
  const [loadingComment, setLoadingComment] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 400);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      const nextPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      router.push(`/signin?redirect=${encodeURIComponent(nextPath)}`);
    }
  }, [authLoading, pathname, router, searchParams, user]);

  const {
    poems,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    handleLike,
  } = useInfiniteFeed({
    userId: user?.uid ?? "",
    debouncedSearch,
    fontFilter,
    sortBy,
  });

  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadedTargetPoemRef = useRef<string | null>(null);
  const poemIdsKey = poems.map((poem) => poem.id).join("|");

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { rootMargin: "200px" } // trigger load 200px before reaching the bottom
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadMore]);

  useEffect(() => {
    if (!targetPoemId || !user || authLoading || loading) return;
    if (loadedTargetPoemRef.current === targetPoemId) return;

    const poemFromFeed = poems.find((poem) => poem.id === targetPoemId);
    if (poemFromFeed) {
      loadedTargetPoemRef.current = targetPoemId;
      setSelectedPoem(poemFromFeed);
      return;
    }

    let cancelled = false;
    const signedInUser = user;

    async function loadTargetPoem() {
      try {
        const token = await signedInUser.getIdToken();
        const response = await fetch(`/api/poems/${targetPoemId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Poem request failed: ${response.status}`);
        }

        const data = (await response.json()) as { poem?: Poem };

        if (!cancelled && data.poem) {
          loadedTargetPoemRef.current = targetPoemId;
          setSelectedPoem(data.poem);
        }
      } catch (error) {
        console.error("[explore] Failed to open linked poem:", error);
        loadedTargetPoemRef.current = targetPoemId;
      }
    }

    loadTargetPoem();

    return () => {
      cancelled = true;
    };
  }, [authLoading, loading, poems, targetPoemId, user]);

  useEffect(() => {
    if (!poemIdsKey) {
      setCommentCounts({});
      return;
    }

    const poemIds = poemIdsKey.split("|");
    const initialCounts = Object.fromEntries(poemIds.map((id) => [id, 0]));
    setCommentCounts(initialCounts);

    const unsubscribers: (() => void)[] = [];
    for (let index = 0; index < poemIds.length; index += 30) {
      const chunk = poemIds.slice(index, index + 30);
      const unsubscribe = onSnapshot(
        query(collection(db, "comments"), where("poemId", "in", chunk)),
        (snapshot) => {
          const chunkCounts: Record<string, number> = Object.fromEntries(
            chunk.map((id) => [id, 0])
          );

          snapshot.docs.forEach((docSnap) => {
            const poemId = docSnap.data().poemId;
            if (typeof poemId === "string") {
              chunkCounts[poemId] = (chunkCounts[poemId] ?? 0) + 1;
            }
          });

          setCommentCounts((current) => ({ ...current, ...chunkCounts }));
        }
      );
      unsubscribers.push(unsubscribe);
    }

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [poemIdsKey]);

  useEffect(() => {
    if (!showComments) {
      setComments([]);
      setNewComment("");
      return;
    }

    const unsubscribe = onSnapshot(
      query(
        collection(db, "comments"),
        where("poemId", "==", showComments),
        orderBy("createdAt", "desc")
      ),
      (snapshot) => {
        const nextComments = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Comment[];
        setComments(nextComments);
      }
    );

    return () => unsubscribe();
  }, [showComments]);

  const handleCommentSubmit = async (event: React.FormEvent, poemId: string) => {
    event.preventDefault();
    const text = newComment.trim();
    if (!text || !user) return;

    setLoadingComment(true);
    try {
      await addDoc(collection(db, "comments"), {
        text,
        poemId,
        authorId: user.uid,
        authorEmail: user.email,
        createdAt: serverTimestamp(),
      });
      setNewComment("");
    } catch (error) {
      console.error("[explore] Failed to add comment:", error);
    } finally {
      setLoadingComment(false);
    }
  };

  if (authLoading) {
    return (
      <div className="relative min-h-screen w-full bg-black/[0.96] antialiased flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="relative min-h-screen w-full bg-black/[0.96] antialiased">
      {selectedPoem && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setSelectedPoem(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-[#0f0f0f] shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-neutral-800 px-6 py-4">
              <h2 className="truncate pr-4 text-xl font-bold tracking-tight text-white">
                {selectedPoem.title}
              </h2>
              <button
                onClick={() => setSelectedPoem(null)}
                className="rounded-full p-1 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-white"
                aria-label="Close poem reader"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {selectedPoem.imageUrl && (
                <Image
                  src={selectedPoem.imageUrl}
                  alt={selectedPoem.title}
                  width={640}
                  height={400}
                  className="mb-6 max-h-80 w-full rounded-lg border border-neutral-800 object-contain"
                />
              )}
              {selectedPoem.content && (
                <pre className="whitespace-pre-wrap text-center font-serif text-base leading-8 text-neutral-200">
                  {selectedPoem.content}
                </pre>
              )}
            </div>

            <div className="flex shrink-0 flex-col gap-3 border-t border-neutral-800 bg-neutral-950/60 px-6 py-3 text-xs text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1">
                  <UserIcon className="h-3.5 w-3.5" />
                  {getAuthorDisplay(selectedPoem)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatPoemDate(selectedPoem.createdAt?.seconds)}
                </span>
              </div>
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5 text-red-400" />
                {selectedPoem.likes?.length ?? 0} likes
              </span>
              <button
                type="button"
                onClick={() => setShowComments(selectedPoem.id)}
                className="flex items-center gap-1 transition-colors hover:text-blue-300"
              >
                <MessageCircle className="h-3.5 w-3.5 text-blue-400" />
                {commentCounts[selectedPoem.id] ?? 0} comments
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showComments && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
              <h3 className="text-lg font-semibold">Comments</h3>
              <button
                type="button"
                onClick={() => setShowComments(null)}
                className="rounded-full p-1 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-white"
                aria-label="Close comments"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {comments.length === 0 ? (
                <p className="py-8 text-center text-sm text-neutral-400">
                  No comments yet. Be the first to comment.
                </p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border-b border-neutral-800 pb-3 last:border-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-neutral-200">
                          {comment.authorEmail || "Poet"}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {formatCommentDate(comment)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-neutral-300">{comment.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={(event) => handleCommentSubmit(event, showComments)}
              className="border-t border-neutral-800 p-4"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(event) => setNewComment(event.target.value)}
                  placeholder="Add a comment..."
                  className="min-w-0 flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-neutral-500 focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={loadingComment || !newComment.trim()}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-900 disabled:text-blue-200"
                  aria-label="Post comment"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-0 [background-size:40px_40px] select-none",
          "[background-image:linear-gradient(to_right,#171717_1px,transparent_1px),linear-gradient(to_bottom,#171717_1px,transparent_1px)]"
        )}
      />

      <Meteors number={25} className="w-full py-6">
        <Navbar
          userEmail={user.email || ""}
          userPhoto={user.photoURL || ""}
          onLogout={logOut}
        />
        <div className="pt-10" />

        <div className="w-full max-w-4xl mx-auto pt-8 px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Explore Poems</h1>
            <p className="text-gray-400">Discover beautiful poetry written by the community</p>
          </div>

          {/* Search & Filters */}
          <div className="mb-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search poems, titles, or authors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-neutral-800 text-white border border-neutral-700 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={fontFilter}
                  onChange={(e) => setFontFilter(e.target.value)}
                  className="px-3 py-2 rounded bg-neutral-800 text-white border border-neutral-700"
                >
                  <option value="all">All Fonts</option>
                  <option value="inter">Inter</option>
                  <option value="serif">Serif</option>
                  <option value="dancing">Dancing Script</option>
                  <option value="handwriting">Handwriting</option>
                  <option value="greatvibes">Great Vibes</option>
                  <option value="cinzel">Cinzel Decorative</option>
                  <option value="indie">Indie Flower</option>
                </select>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded bg-neutral-800 text-white border border-neutral-700"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most-liked">Most Liked</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (() => {
            const isMissingIndex =
              error.toLowerCase().includes("requires an index") ||
              error.toLowerCase().includes("failed to load poems");
            return (
              <div className="mb-6 p-4 rounded-lg bg-red-900/50 border border-red-500 text-red-200 space-y-2">
                <p className="font-semibold text-sm">
                  {isMissingIndex
                    ? "⚠️ A Firestore composite index is missing."
                    : error}
                </p>
                {isMissingIndex && (
                  <>
                    <p className="text-xs text-red-300">
                      The explore feed requires a composite index on{" "}
                      <code className="bg-red-950/60 px-1 rounded">poems</code> for{" "}
                      <code className="bg-red-950/60 px-1 rounded">authorId (!=)</code> +{" "}
                      <code className="bg-red-950/60 px-1 rounded">createdAt (desc)</code>.
                      Check your browser console for a direct link to create it in the Firebase Console.
                    </p>
                    <button
                      onClick={() => router.refresh()}
                      className="px-3 py-1 bg-red-800 hover:bg-red-700 rounded text-sm transition-colors"
                    >
                      Retry after creating the index
                    </button>
                  </>
                )}
                {!isMissingIndex && (
                  <button
                    onClick={() => router.refresh()}
                    className="px-3 py-1 bg-red-800 hover:bg-red-700 rounded text-sm transition-colors"
                  >
                    Retry
                  </button>
                )}
              </div>
            );
          })()}

          {/* Initial Loading Skeletons */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <PoemCardSkeleton key={idx} />
              ))}
            </div>
          ) : (
            <>
              {/* Poems Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {poems.map((poem) => (
                  <PoemFeedCard
                    key={poem.id}
                    poem={poem}
                    userId={user.uid}
                    commentCount={commentCounts[poem.id] ?? 0}
                    onLike={handleLike}
                    onComment={setShowComments}
                    onOpen={setSelectedPoem}
                  />
                ))}
              </div>

              {/* Empty state */}
              {poems.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg">
                    {debouncedSearch
                      ? `No poems match "${debouncedSearch}"`
                      : "No poems from others yet."}
                  </div>
                  <div className="text-gray-500 text-sm mt-2">
                    {debouncedSearch
                      ? "Try adjusting your search query or filters."
                      : "Be the first to share a poem today!"}
                  </div>
                  {!debouncedSearch && (
                    <button
                      onClick={() => router.push("/create")}
                      className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-semibold"
                    >
                      Let&apos;s Get Writing
                    </button>
                  )}
                </div>
              )}

              {/* Infinite Scroll Sentinel & Loading More Skeletons */}
              {hasMore && (
                <div ref={sentinelRef} className="mt-8">
                  {loadingMore && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Array.from({ length: 3 }).map((_, idx) => (
                        <PoemCardSkeleton key={`more-skeleton-${idx}`} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* End of Feed Message */}
              {!hasMore && poems.length > 0 && (
                <div className="text-center text-gray-500 text-sm py-12">
                  You&apos;ve reached the end of the feed ✨
                </div>
              )}
            </>
          )}
        </div>
      </Meteors>
    </div>
  );
};

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="relative min-h-screen w-full bg-black/[0.96] antialiased flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      }
    >
      <ExplorePageContent />
    </Suspense>
  );
}
