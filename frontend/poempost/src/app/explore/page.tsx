"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import Navbar from "@/components/ui/Navbar";
import { Meteors } from "@/components/ui/meteors";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useDebounce } from "@/hooks/useDebounce";
import { useInfiniteFeed } from "@/hooks/useInfiniteFeed";
import { PoemFeedCard } from "@/components/explore/PoemFeedCard";
import { PoemCardSkeleton } from "@/components/explore/PoemCardSkeleton";
import { Calendar, Filter, Heart, Search, User as UserIcon, X } from "lucide-react";

const getAuthorDisplay = (poem: ReturnType<typeof useInfiniteFeed>["poems"][number]) =>
  poem.authorName || poem.authorEmail?.split("@")[0] || "Poet";

const formatPoemDate = (seconds: number | undefined) => {
  if (seconds === undefined) return "";

  return new Date(seconds * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const ExplorePage: React.FC = () => {
  const { currentUser: user, loading: authLoading, logOut } = useAuth();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [fontFilter, setFontFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedPoem, setSelectedPoem] = useState<ReturnType<typeof useInfiniteFeed>["poems"][number] | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 400);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin");
    }
  }, [authLoading, user, router]);

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
            </div>
          </motion.div>
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
                    onLike={handleLike}
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

export default ExplorePage;
