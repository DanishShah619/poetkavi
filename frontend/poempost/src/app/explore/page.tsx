"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import { Meteors } from "@/components/ui/meteors";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useDebounce } from "@/hooks/useDebounce";
import { useInfiniteFeed } from "@/hooks/useInfiniteFeed";
import { PoemFeedCard } from "@/components/explore/PoemFeedCard";
import { PoemCardSkeleton } from "@/components/explore/PoemCardSkeleton";
import { Search, Filter } from "lucide-react";

const ExplorePage: React.FC = () => {
  const { currentUser: user, loading: authLoading, logOut } = useAuth();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [fontFilter, setFontFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

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
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-900/50 border border-red-500 text-red-200 flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => router.refresh()}
                className="px-3 py-1 bg-red-800 hover:bg-red-700 rounded text-sm transition-colors"
              >
                Retry
              </button>
            </div>
          )}

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