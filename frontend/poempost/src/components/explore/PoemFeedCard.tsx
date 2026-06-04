"use client";

import React from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Heart, Calendar, User as UserIcon } from "lucide-react";
import { BackgroundGradient } from "@/components/ui/background-gradient";
import { Poem } from "@/hooks/useInfiniteFeed";

interface PoemFeedCardProps {
  poem: Poem;
  userId: string;
  onLike: (poemId: string) => void;
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

export function PoemFeedCard({ poem, userId, onLike }: PoemFeedCardProps) {
  const isLiked = poem.likes.includes(userId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="h-full"
    >
      <BackgroundGradient className="rounded-2xl p-[1px] h-full">
        <div className="rounded-2xl bg-neutral-900 p-6 border border-white/10 h-full flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="mb-4">
              <h3 className={`text-xl font-bold text-white mb-2 ${getFontClass(poem.font)}`}>
                {poem.title}
              </h3>
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

          {/* Like button & footer */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
            <button
              onClick={() => onLike(poem.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                isLiked
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-neutral-800 hover:bg-neutral-700 text-gray-300"
              }`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
              <span>{poem.likes?.length ?? 0}</span>
            </button>
            <div className="text-xs text-gray-500">Font: {poem.font}</div>
          </div>
        </div>
      </BackgroundGradient>
    </motion.div>
  );
}
