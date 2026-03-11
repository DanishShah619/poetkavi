"use client";
import { useEffect, useState } from "react";
import { motion, stagger, useAnimate } from "motion/react";
import { cn } from "@/lib/utils";

export const AnimatedText = ({
  words,
  className,
  effect = "generate", // "generate" | "colorful" | "both"
  filter = true,
  duration = 5,
  staggerDelay = 0.002,
  colorChangeInterval = 5000,
}: {
  words: string;
  className?: string;
  effect?: "generate" | "colorful" | "both";
  filter?: boolean;
  duration?: number;
  staggerDelay?: number;
  colorChangeInterval?: number;
}) => {
  const [scope, animate] = useAnimate();
  const [currentColors, setCurrentColors] = useState([
    "rgb(131, 179, 32)",
    "rgb(47, 195, 106)",
    "rgb(42, 169, 210)",
    "rgb(4, 112, 202)",
    "rgb(107, 10, 255)",
    "rgb(183, 0, 218)",
    "rgb(218, 0, 171)",
    "rgb(230, 64, 92)",
    "rgb(232, 98, 63)",
    "rgb(249, 129, 47)",
  ]);
  const [colorCount, setColorCount] = useState(0);

  const colors = [
    "rgb(131, 179, 32)",
    "rgb(47, 195, 106)",
    "rgb(42, 169, 210)",
    "rgb(4, 112, 202)",
    "rgb(107, 10, 255)",
    "rgb(183, 0, 218)",
    "rgb(218, 0, 171)",
    "rgb(230, 64, 92)",
    "rgb(232, 98, 63)",
    "rgb(249, 129, 47)",
  ];

  // Generate effect animation
  useEffect(() => {
    if (effect === "generate" || effect === "both") {
      animate(
        ".word-span",
        {
          opacity: 1,
          filter: filter ? "blur(0px)" : "none",
        },
        {
          duration: duration,
          delay: stagger(staggerDelay),
        }
      );
    }
  }, [scope.current, effect, filter, duration, staggerDelay, animate]);

  // Colorful effect animation
  useEffect(() => {
    if (effect === "colorful" || effect === "both") {
      const interval = setInterval(() => {
        const shuffled = [...colors].sort(() => Math.random() - 0.5);
        setCurrentColors(shuffled);
        setColorCount((prev) => prev + 1);
      }, colorChangeInterval);
      return () => clearInterval(interval);
    }
  }, [effect, colorChangeInterval]);

  const renderGenerateEffect = () => {
    const wordsArray = words.split(" ");
    return (
      <motion.div ref={scope}>
        {wordsArray.map((word, idx) => (
          <motion.span
            key={word + idx}
            className="word-span dark:text-white opacity-0 inline-block mr-2"
            style={{
              filter: filter ? "blur(10px)" : "none",
            }}
          >
            {word}
          </motion.span>
        ))}
      </motion.div>
    );
  };

  const renderColorfulEffect = () => {
    return words.split("").map((char, index) => (
      <motion.span
        key={`${char}-${colorCount}-${index}`}
        initial={{
          y: 0,
        }}
        animate={{
          color: currentColors[index % currentColors.length],
          y: [0, -3, 0],
          scale: [1, 1.01, 1],
          filter: ["blur(0px)", "blur(5px)", "blur(0px)"],
          opacity: [1, 0.8, 1],
        }}
        transition={{
          duration: 0.5,
          delay: index * 0.05,
        }}
        className="inline-block whitespace-pre font-sans tracking-tight"
      >
        {char}
      </motion.span>
    ));
  };

  const renderBothEffects = () => {
    const wordsArray = words.split(" ");
    return (
      <motion.div ref={scope}>
        {wordsArray.map((word, wordIdx) => (
          <motion.span
            key={word + wordIdx}
            className="word-span opacity-0 inline-block mr-2"
            style={{
              filter: filter ? "blur(10px)" : "none",
            }}
          >
            {word.split("").map((char, charIdx) => (
              <motion.span
                key={`${char}-${colorCount}-${wordIdx}-${charIdx}`}
                animate={{
                  color: currentColors[(wordIdx * word.length + charIdx) % currentColors.length],
                  y: [0, -3, 0],
                  scale: [1, 1.01, 1],
                  filter: ["blur(0px)", "blur(5px)", "blur(0px)"],
                  opacity: [1, 0.8, 1],
                }}
                transition={{
                  duration: 0.5,
                  delay: (wordIdx * word.length + charIdx) * 0.05,
                }}
                className="inline-block font-sans tracking-tight"
              >
                {char}
              </motion.span>
            ))}
          </motion.span>
        ))}
      </motion.div>
    );
  };

  const renderContent = () => {
    switch (effect) {
      case "generate":
        return renderGenerateEffect();
      case "colorful":
        return renderColorfulEffect();
      case "both":
        return renderBothEffects();
      default:
        return renderGenerateEffect();
    }
  };

  return (
    <div className={cn("font-bold", className)}>
      <div className="mt-4">
        <div className="dark:text-white text-gray-500 opacity-100 text-2xl leading-snug tracking-wide">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};