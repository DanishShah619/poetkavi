"use client";

import Navbar from "@/components/ui/Navbar";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signOut, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Meteors } from "@/components/ui/meteors";
import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  orderBy, 
  query, 
  updateDoc, 
  doc, 
  arrayUnion, 
  arrayRemove,
  where,
  Timestamp
} from "firebase/firestore";
import { BackgroundGradient } from "@/components/ui/background-gradient";
import { Search, Heart, Calendar, User as UserIcon, Filter } from "lucide-react";

interface Poem {
  id: string;
  title: string;
  content: string;
  font: string;
  imageUrl?: string;
  createdAt: any;
  authorId: string;
  authorEmail: string;
  likes: string[];
}

const ExplorePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [poems, setPoems] = useState<Poem[]>([]);
  const [filteredPoems, setFilteredPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [fontFilter, setFontFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchPoems();
  }, [user]);

  useEffect(() => {
    filterAndSortPoems();
  }, [poems, searchTerm, fontFilter, sortBy]);

  const fetchPoems = async () => {
    if (!user) return;
    
    try {
      // Calculate 24 hours ago
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      const twentyFourHoursAgoTimestamp = Timestamp.fromDate(twentyFourHoursAgo);
      
      // Query for poems from other users in the last 24 hours
      const q = query(
        collection(db, "poems"),
        where("authorId", "!=", user.uid),
        where("createdAt", ">=", twentyFourHoursAgoTimestamp),
        orderBy("authorId"),
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const poemsData: Poem[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        poemsData.push({
          id: doc.id,
          ...data,
          likes: Array.isArray(data.likes) ? data.likes : []
        } as Poem);
      });
      
      setPoems(poemsData);
    } catch (error) {
      console.error("Error fetching poems:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortPoems = () => {
    let filtered = poems.filter(poem => {
      const matchesSearch = poem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           poem.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           poem.authorEmail.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFont = fontFilter === "all" || poem.font === fontFilter;
      
      return matchesSearch && matchesFont;
    });

    // Sort poems
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return b.createdAt?.seconds - a.createdAt?.seconds;
        case "oldest":
          return a.createdAt?.seconds - b.createdAt?.seconds;
        case "most-liked":
          return (b.likes?.length || 0) - (a.likes?.length || 0);
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredPoems(filtered);
  };

  const handleLike = async (poemId: string) => {
    if (!user) return;
    
    try {
      const poemRef = doc(db, "poems", poemId);
      const poem = poems.find(p => p.id === poemId);
      
      if (poem?.likes?.includes(user.uid)) {
        // Unlike
        await updateDoc(poemRef, {
          likes: arrayRemove(user.uid)
        });
      } else {
        // Like
        await updateDoc(poemRef, {
          likes: arrayUnion(user.uid)
        });
      }
      
      // Update local state
      setPoems(prevPoems =>
        prevPoems.map(p =>
          p.id === poemId
            ? {
                ...p,
                likes: (p.likes || []).includes(user.uid)
                  ? (p.likes || []).filter(uid => uid !== user.uid)
                  : [...(p.likes || []), user.uid]
              }
            : p
        )
      );
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      console.log("Signed out successfully");
      router.push("/signin");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getFontClass = (font: string) => {
    const fontMap: { [key: string]: string } = {
      inter: "font-inter",
      serif: "font-serif",
      dancing: "font-dancing",
      handwriting: "font-handwriting",
      greatvibes: "font-greatvibes",
      cinzel: "font-cinzel",
      indie: "font-indie"
    };
    return fontMap[font] || "font-inter";
  };

  if (loading) {
    return (
      <div className="relative min-h-screen w-full bg-black/[0.96] antialiased flex items-center justify-center">
        <div className="text-white text-xl">Loading poems...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-black/[0.96] antialiased">
      {/* Grid pattern background */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-0 [background-size:40px_40px] select-none",
          "[background-image:linear-gradient(to_right,#171717_1px,transparent_1px),linear-gradient(to_bottom,#171717_1px,transparent_1px)]"
        )}
      />

      {/* Animated Meteors */}
      <Meteors number={25} className="w-full py-6">
        <Navbar
          userEmail={user?.email || "user@example.com"}
          userPhoto={user?.photoURL || ""}
          onLogout={handleLogout}
        />
        <div className="pt-10"></div>

        {/* Header and Controls */}
        <div className="w-full max-w-4xl mx-auto pt-8 px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Explore Recent Poems
            </h1>
            <p className="text-gray-400">
              Discover poems written by others in the last 24 hours
            </p>
          </div>

          {/* Search and Filter Controls */}
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

          {/* Poems Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPoems.map((poem) => (
              <BackgroundGradient key={poem.id} className="rounded-2xl p-[1px]">
                <div className="rounded-2xl bg-neutral-900 p-6 border border-white/10 h-full flex flex-col">
                  {/* Poem Header */}
                  <div className="mb-4">
                    <h3 className={`text-xl font-bold text-white mb-2 ${getFontClass(poem.font)}`}>
                      {poem.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <UserIcon className="h-4 w-4" />
                      <span>{poem.authorEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(poem.createdAt)}</span>
                    </div>
                  </div>

                  {/* Poem Content */}
                  <div className="flex-1 mb-4">
                    {poem.imageUrl ? (
                      <div className="relative">
                        <img
                          src={poem.imageUrl}
                          alt={poem.title}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        {poem.content && (
                          <div className="mt-3">
                            <p className={`text-gray-300 text-sm whitespace-pre-line ${getFontClass(poem.font)}`}>
                              {poem.content.length > 100 
                                ? `${poem.content.substring(0, 100)}...` 
                                : poem.content}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className={`text-gray-300 whitespace-pre-line ${getFontClass(poem.font)}`}>
                        {poem.content.length > 200 
                          ? `${poem.content.substring(0, 200)}...` 
                          : poem.content}
                      </p>
                    )}
                  </div>

                  {/* Like Button */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleLike(poem.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        (poem.likes || []).includes(user?.uid || "")
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-neutral-800 hover:bg-neutral-700 text-gray-300"
                      }`}
                    >
                      <Heart 
                        className={`h-4 w-4 ${
                          (poem.likes || []).includes(user?.uid || "") ? "fill-current" : ""
                        }`} 
                      />
                      <span>{poem.likes?.length || 0}</span>
                    </button>

                    <div className="text-xs text-gray-500">
                      Font: {poem.font}
                    </div>
                  </div>
                </div>
              </BackgroundGradient>
            ))}
          </div>

          {/* No results message */}
          {filteredPoems.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg">
                {searchTerm || fontFilter !== "all" 
                  ? "No poems match your search criteria." 
                  : "No new poems from others in the last 24 hours."}
              </div>
              <div className="text-gray-500 text-sm mt-2">
                {searchTerm || fontFilter !== "all" 
                  ? "Try adjusting your search or filters." 
                  : "Check back later for fresh content from the community!"}
              </div>
              <button
                onClick={() => router.push("/create")}
                className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-semibold"
              >
                Let's Get Writing
              </button>
            </div>
          )}
        </div>
      </Meteors>
    </div>
  );
};

export default ExplorePage;