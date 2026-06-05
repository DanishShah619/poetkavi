"use client";

import React from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Heart, Calendar, Maximize2, MessageCircle, User as UserIcon } from "lucide-react";
import { BackgroundGradient } from "@/components/ui/background-gradient";
import { Poem } from "@/hooks/useInfiniteFeed";

interface PoemFeedCardProps {
  poem: Poem;
  userId: string;
  commentCount: number;
  onLike: (poemId: string) => void;
  onComment: (poemId: string) => void;
  onOpen: (poem: Poem) => void;
}

const getAuthorDisplay = (poem: Poem): string =>
  poem.authorName || poem.authorEmail?.split("@")[0] || "Poet";

const formatDate = (seconds: number | undefined) => {
  if (seconds === undefined) return "";
  return new Date(seconds * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getFontClass = (font: string) => {
  const map: Record<string, string> = {
    inter: "font-inter",
    serif: "font-serif",
    dancing: "font-dancing",
    handwriting: "font-handwriting",
    greatvibes: "font-greatvibes",
    cinzel: "font-cinzel",
    indie: "font-indie",
  };
  return map[font] ?? "font-inter";
};

export function PoemFeedCard({
  poem,
  userId,
  commentCount,
  onLike,
  onComment,
  onOpen,
}: PoemFeedCardProps) {
  const isLiked = poem.likes.includes(userId);
  const openPoem = () => onOpen(poem);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="h-full"
    >
      <BackgroundGradient className="rounded-2xl p-[1px] h-full">
        <div
          onClick={openPoem}
          className="rounded-2xl bg-neutral-900 p-6 border border-white/10 h-full flex flex-col justify-between cursor-pointer transition-colors hover:border-white/20"
          title="Read full poem"
        >
          <div>
            {/* Header */}
            <div className="mb-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <h3 className={`text-xl font-bold text-white ${getFontClass(poem.font)}`}>
                  {poem.title}
                </h3>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openPoem();
                  }}
                  className="shrink-0 rounded-md p-1 text-gray-500 transition-colors hover:bg-neutral-800 hover:text-indigo-300"
                  aria-label={`Read ${poem.title}`}
                  title="Read full poem"
                >
                  <Maximize2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <UserIcon className="h-4 w-4" />
                <span>{getAuthorDisplay(poem)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(poem.createdAt?.seconds)}</span>
              </div>
            </div>

            {/* Content */}
            <div className="mb-4">
              {poem.imageUrl ? (
                <div className="relative">
                  <Image
                    src={poem.imageUrl}
                    alt={poem.title}
                    width={600}
                    height={192}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  {poem.content && (
                    <p className={`mt-3 text-gray-300 text-sm whitespace-pre-line ${getFontClass(poem.font)}`}>
                      {poem.content.length > 100
                        ? `${poem.content.substring(0, 100)}...`
                        : poem.content}
                    </p>
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
          </div>

          {/* Like/comment actions & footer */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onLike(poem.id);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  isLiked
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-neutral-800 hover:bg-neutral-700 text-gray-300"
                }`}
                aria-label={isLiked ? "Unlike poem" : "Like poem"}
              >
                <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                <span>{poem.likes?.length ?? 0}</span>
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onComment(poem.id);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800 text-gray-300 transition-colors hover:bg-neutral-700 hover:text-blue-300"
                aria-label={`Comment on ${poem.title}`}
              >
                <MessageCircle className="h-4 w-4" />
                <span>{commentCount}</span>
              </button>
            </div>
            <div className="text-xs text-gray-500">Font: {poem.font}</div>
          </div>
        </div>
      </BackgroundGradient>
    </motion.div>
  );
}
