"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  DraggableCardContainer,
  DraggableCardBody,
} from "@/components/ui/draggable-card";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { TextGenerateEffect } from "./ui/text-generate-effect";
import { MessageCircle, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

const randomX = () => Math.floor(Math.random() * 60) + 10;
const randomY = () => Math.floor(Math.random() * 40) + 10;
const randomAngle = () => Math.floor(Math.random() * 20) - 10;

interface Comment {
  id: string;
  text: string;
  authorEmail: string;
  authorId: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
  poemId: string;
}

interface Poem {
  id: string;
  title?: string;
  content?: string;
  imageUrl?: string;
  createdAt?: { seconds: number; nanoseconds: number };
  likes: string[];
}

export default function MyPoems() {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComment, setLoadingComment] = useState(false);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const { currentUser: user } = useAuth();

  const positions = useRef<Record<string, { x: number; y: number; angle: number }>>({});

  const getPosition = (id: string) => {
    if (!positions.current[id]) {
      positions.current[id] = { x: randomX(), y: randomY(), angle: randomAngle() };
    }
    return positions.current[id];
  };

  const fetchCommentCounts = async (poemIds: string[]) => {
    if (poemIds.length === 0) return;
    const counts: Record<string, number> = {};
    poemIds.forEach((id) => {
      counts[id] = 0;
    });

    const chunks: string[][] = [];
    for (let i = 0; i < poemIds.length; i += 30) {
      chunks.push(poemIds.slice(i, i + 30));
    }

    try {
      for (const chunk of chunks) {
        const q = query(
          collection(db, "comments"),
          where("poemId", "in", chunk)
        );
        const snap = await getDocs(q);
        snap.docs.forEach((doc) => {
          const data = doc.data();
          if (data.poemId) {
            counts[data.poemId] = (counts[data.poemId] || 0) + 1;
          }
        });
      }
      setCommentCounts(counts);
    } catch (err) {
      console.error("Error fetching comment counts:", err);
    }
  };

  useEffect(() => {
    const fetchPoems = async () => {
      if (!user) return;

      const q = query(
        collection(db, "poems"),
        where("authorId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);
      const data = snap.docs
        .map((doc) => {
          const docData = doc.data();
          return {
            id: doc.id,
            ...docData,
            likes: Array.isArray(docData.likes) ? docData.likes : [],
          } as Poem;
        })
        .filter(
          (poem) =>
            (poem.content && !poem.imageUrl) ||
            (!poem.content && poem.imageUrl)
        );

      setPoems(data);
      fetchCommentCounts(data.map((p) => p.id));
    };

    fetchPoems();
  }, [user]);

  useEffect(() => {
    if (showComments) {
      const commentsQuery = query(
        collection(db, "comments"),
        where("poemId", "==", showComments),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
        const commentsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Comment[];
        setComments(commentsData);
      });

      return () => unsubscribe();
    }
  }, [showComments]);

  const toggleLike = async (poemId: string, isLiked: boolean) => {
    if (!user) return;

    const ref = doc(db, "poems", poemId);

    await updateDoc(ref, {
      likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
    });

    setPoems((prev) =>
      prev.map((poem) =>
        poem.id === poemId
          ? {
              ...poem,
              likes: isLiked
                ? (poem.likes ?? []).filter((uid) => uid !== user.uid)
                : [...(poem.likes ?? []), user.uid],
            }
          : poem
      )
    );
  };

  const handleComment = async (e: React.FormEvent, poemId: string) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setLoadingComment(true);
    try {
      await addDoc(collection(db, "comments"), {
        text: newComment.trim(),
        poemId: poemId,
        authorId: user.uid,
        authorEmail: user.email,
        createdAt: serverTimestamp(),
      });
      setNewComment("");
      setCommentCounts((prev) => ({
        ...prev,
        [poemId]: (prev[poemId] || 0) + 1,
      }));
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setLoadingComment(false);
    }
  };

  return (
    <>
      <TextGenerateEffect
        words="IN MY WORD PARADISE"
        className="text-4xl text-white font-bold text-center mb-8"
      />

      {/* Comments Modal */}
      {showComments && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Comments</h3>
              <button
                onClick={() => setShowComments(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border-b pb-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {comment.authorEmail}
                        </span>
                        <span className="text-xs text-gray-500">
                          {comment.createdAt && typeof comment.createdAt.seconds === "number" &&
                            format(
                              new Date(comment.createdAt.seconds * 1000),
                              "dd MMM yyyy"
                            )}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">{comment.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => handleComment(e, showComments)}
              className="p-4 border-t"
            >
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={loadingComment || !newComment.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DraggableCardContainer className="relative w-full h-screen overflow-clip">
        {poems.map((poem) => {
          const isLiked = user?.uid ? (poem.likes ?? []).includes(user.uid) : false;
          const pos = getPosition(poem.id);

          return (
            <DraggableCardBody
              key={poem.id}
              style={{
                position: "absolute",
                top: `${pos.y}%`,
                left: `${pos.x}%`,
                transform: `rotate(${pos.angle}deg)`,
              }}
            >
              <div
                className={cn(
                  "bg-white shadow-lg rounded-md p-3 pb-4 w-80",
                  !poem.content && poem.imageUrl
                    ? "min-h-[360px]"
                    : "min-h-[250px]"
                )}
              >
                {/* Title */}
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-gray-800 text-center border-b pb-2">
                    {poem.title}
                  </h3>
                </div>

                {/* Image */}
                {poem.imageUrl && (
                  <Image
                    src={poem.imageUrl}
                    alt="Poem"
                    width={320}
                    height={208}
                    className="w-full h-52 object-contain rounded mb-3"
                  />
                )}

                {/* Text Content */}
                {poem.content && (
                  <pre className="whitespace-pre-wrap font-serif text-sm text-center mb-3">
                    {poem.content}
                  </pre>
                )}

                {/* Footer: Date, Likes, Comments */}
                <div className="flex flex-col items-start mt-3 px-2 text-sm text-gray-600 space-y-2">
                  <span>
                    {poem.createdAt && typeof poem.createdAt.seconds === "number"
                      ? format(
                          new Date(poem.createdAt.seconds * 1000),
                          "dd MMM yyyy"
                        )
                      : ""}
                  </span>

                  <div className="flex items-center space-x-4">
                    {/* Like Button */}
                    <motion.button
                      whileTap={{ scale: 1.4 }}
                      whileHover={{ scale: 1.1 }}
                      onClick={() => toggleLike(poem.id, !!isLiked)}
                      className={cn(
                        "transition-colors duration-150 flex items-center space-x-1",
                        isLiked ? "text-red-600" : "text-gray-400 hover:text-red-600"
                      )}
                    >
                      <span>{isLiked ? "💖" : "🤍"}</span>
                      <span>{poem.likes?.length ?? 0}</span>
                    </motion.button>

                    {/* Comment Button */}
                    <motion.button
                      whileTap={{ scale: 1.1 }}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setShowComments(poem.id)}
                      className="flex items-center space-x-1 text-gray-400 hover:text-blue-600 transition-colors duration-150"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{commentCounts[poem.id] ?? 0}</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </DraggableCardBody>
          );
        })}
      </DraggableCardContainer>
    </>
  );
}
