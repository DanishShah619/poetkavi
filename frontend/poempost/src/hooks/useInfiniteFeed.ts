import { useCallback, useEffect, useRef, useState } from "react";
import {
  collection,
  doc,
  DocumentSnapshot,
  DocumentData,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  Timestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Poem {
  id: string;
  title: string;
  content: string;
  font: string;
  imageUrl?: string;
  createdAt: Timestamp;
  authorId: string;
  authorName?: string;
  authorEmail?: string;
  likes: string[];
}

export interface UseFeedReturn {
  poems: Poem[];
  /** True only during the very first load or after a filter/search reset */
  loading: boolean;
  /** True when fetching the next page (not the first) */
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
  handleLike: (poemId: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 12;

/**
 * How many docs to pull for client-side search.
 * NOTE: For production scale, replace the search path with Algolia / Typesense.
 */
const SEARCH_BATCH = 60;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function applyClientSort(poems: Poem[], sortBy: string): Poem[] {
  const copy = [...poems];
  switch (sortBy) {
    case "oldest":
      return copy.sort(
        (a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0)
      );
    case "most-liked":
      return copy.sort(
        (a, b) => (b.likes?.length ?? 0) - (a.likes?.length ?? 0)
      );
    case "title":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case "newest":
    default:
      return copy.sort(
        (a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)
      );
  }
}

function matchesSearch(poem: Poem, term: string): boolean {
  const t = term.toLowerCase();
  const author =
    poem.authorName || poem.authorEmail?.split("@")[0] || "Poet";
  return (
    poem.title.toLowerCase().includes(t) ||
    poem.content.toLowerCase().includes(t) ||
    author.toLowerCase().includes(t)
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useInfiniteFeed({
  userId,
  debouncedSearch,
  fontFilter,
  sortBy,
}: {
  userId: string;
  debouncedSearch: string;
  fontFilter: string;
  sortBy: string;
}): UseFeedReturn {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Firestore cursor for feed mode
  const lastDocRef = useRef<DocumentSnapshot<unknown, DocumentData> | null>(null);
  // Prevent concurrent fetches
  const fetchingRef = useRef(false);

  // ---------------------------------------------------------------------------
  // FEED MODE — cursor-based server pagination
  // ---------------------------------------------------------------------------

  const fetchFeedPage = useCallback(
    async (isReset: boolean) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      if (isReset) {
        setLoading(true);
        setError(null);
        lastDocRef.current = null;
      } else {
        setLoadingMore(true);
      }

      try {
        const constraints = [
          collection(db, "poems"),
          where("authorId", "!=", userId),
          orderBy("authorId"),
          orderBy("createdAt", "desc"),
          ...(lastDocRef.current ? [startAfter(lastDocRef.current)] : []),
          limit(PAGE_SIZE),
        ] as Parameters<typeof query>;

        const q = query(...constraints);
        const snap = await getDocs(q);

        const fetched: Poem[] = snap.docs.map((d) => {
          const data = d.data() as Omit<Poem, "id">;
          return {
            id: d.id,
            ...data,
            likes: Array.isArray(data.likes) ? data.likes : [],
          };
        });

        lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
        setHasMore(snap.docs.length === PAGE_SIZE);

        setPoems((prev) =>
          applyClientSort(isReset ? fetched : [...prev, ...fetched], sortBy)
        );
      } catch (err) {
        console.error("[useInfiniteFeed] feed fetch error:", err);
        setError("Failed to load poems. Please try again.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
        fetchingRef.current = false;
      }
    },
    [userId, sortBy]
  );

  // ---------------------------------------------------------------------------
  // SEARCH MODE — load a larger batch, filter client-side
  // NOTE: Replace this block with an Algolia call for full production-scale
  //       full-text search.
  // ---------------------------------------------------------------------------

  const fetchSearch = useCallback(
    async (term: string) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const q = query(
          collection(db, "poems"),
          orderBy("createdAt", "desc"),
          limit(SEARCH_BATCH)
        );

        const snap = await getDocs(q);
        const all: Poem[] = snap.docs
          .map((d) => {
            const data = d.data() as Omit<Poem, "id">;
            return {
              id: d.id,
              ...data,
              likes: Array.isArray(data.likes) ? data.likes : [],
            };
          })
          // exclude own poems
          .filter((p) => p.authorId !== userId)
          // text match
          .filter((p) => matchesSearch(p, term))
          // font filter
          .filter((p) => fontFilter === "all" || p.font === fontFilter);

        setPoems(applyClientSort(all, sortBy));
        // Search mode loads everything at once — no further pages
        setHasMore(false);
      } catch (err) {
        console.error("[useInfiniteFeed] search fetch error:", err);
        setError("Search failed. Please try again.");
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    },
    [userId, fontFilter, sortBy]
  );

  // ---------------------------------------------------------------------------
  // Effects — reset + reload when filters / search changes
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (debouncedSearch.trim()) {
      fetchSearch(debouncedSearch.trim());
    } else {
      fetchFeedPage(true);
    }
  }, [debouncedSearch, fontFilter, sortBy, fetchFeedPage, fetchSearch]);

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading || debouncedSearch.trim()) return;
    fetchFeedPage(false);
  }, [hasMore, loadingMore, loading, debouncedSearch, fetchFeedPage]);

  const handleLike = useCallback(
    async (poemId: string) => {
      const poem = poems.find((p) => p.id === poemId);
      if (!poem) return;

      const isLiked = poem.likes.includes(userId);
      const poemRef = doc(db, "poems", poemId);

      // Optimistic update
      setPoems((prev) =>
        prev.map((p) =>
          p.id === poemId
            ? {
                ...p,
                likes: isLiked
                  ? p.likes.filter((uid) => uid !== userId)
                  : [...p.likes, userId],
              }
            : p
        )
      );

      try {
        await updateDoc(poemRef, {
          likes: isLiked ? arrayRemove(userId) : arrayUnion(userId),
        });
      } catch (err) {
        console.error("[useInfiniteFeed] like error:", err);
        // Revert on failure
        setPoems((prev) =>
          prev.map((p) =>
            p.id === poemId
              ? {
                  ...p,
                  likes: isLiked
                    ? [...p.likes, userId]
                    : p.likes.filter((uid) => uid !== userId),
                }
              : p
          )
        );
      }
    },
    [poems, userId]
  );

  return {
    poems,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    handleLike,
  };
}
