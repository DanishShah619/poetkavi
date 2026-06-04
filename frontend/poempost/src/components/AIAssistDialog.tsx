"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, RefreshCw, CheckCheck, Wand2, AlertCircle, PlusCircle } from "lucide-react";
import { auth } from "@/lib/firebase";

// ---------------------------------------------------------------------------
// Keyword definitions
// ---------------------------------------------------------------------------
const MOOD_KEYWORDS = [
  { id: "melancholic",      label: "Melancholic",      emoji: "🌑" },
  { id: "self-musing",      label: "Self-Musing",      emoji: "🌀" },
  { id: "romantic",         label: "Romantic",         emoji: "🌹" },
  { id: "betrayed-passion", label: "Betrayed Passion", emoji: "💔" },
  { id: "lively",           label: "Lively",           emoji: "⚡" },
  { id: "uplifting",        label: "Uplifting",        emoji: "🌤️" },
  { id: "reflection",       label: "Reflection",       emoji: "🪞" },
];

const STYLE_KEYWORDS = [
  { id: "sufi",          label: "Sufi",          emoji: "🌙" },
  { id: "rich-imagery",  label: "Rich Imagery",  emoji: "🎨" },
  { id: "persian",       label: "Persian",       emoji: "🏛️" },
  { id: "ornate",        label: "Ornate",        emoji: "✨" },
  { id: "simple",        label: "Simple",        emoji: "🌿" },
  { id: "dramatic",      label: "Dramatic",      emoji: "🎭" },
];

const MAX_KEYWORDS = 4;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface AIAssistDialogProps {
  open: boolean;
  onClose: () => void;
  poemContent: string;
  /** userId is no longer needed on the client — token is sent via Authorization header */
  userId?: string;
  onAccept: (suggestion: string, mode: "replace" | "append") => void;
}

// ---------------------------------------------------------------------------
// Keyword chip
// ---------------------------------------------------------------------------
function KeywordChip({
  label,
  emoji,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  emoji: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      whileHover={!disabled ? { scale: 1.04 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
        border transition-all duration-200 select-none
        ${selected
          ? "bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/30"
          : disabled
            ? "bg-neutral-800/50 border-neutral-700/50 text-neutral-600 cursor-not-allowed"
            : "bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-indigo-500/60 hover:text-white cursor-pointer"
        }
      `}
    >
      <span>{emoji}</span>
      <span>{label}</span>
      {selected && <CheckCheck className="w-3 h-3 ml-0.5 text-indigo-200" />}
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Main dialog
// ---------------------------------------------------------------------------
export function AIAssistDialog({
  open,
  onClose,
  poemContent,
  onAccept,
}: AIAssistDialogProps) {
  const [selected, setSelected]       = useState<string[]>([]);
  const [loading, setLoading]         = useState(false);
  const [suggestion, setSuggestion]   = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [remaining, setRemaining]     = useState<number | null>(null);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);

  const toggleKeyword = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((k) => k !== id);
      if (prev.length >= MAX_KEYWORDS) return prev; // already at max
      return [...prev, id];
    });
  };

  const handleGenerate = async () => {
    if (!selected.length) return;
    setLoading(true);
    setError(null);
    setSuggestion(null);
    setConfirmOverwrite(false);

    const labelMap = [...MOOD_KEYWORDS, ...STYLE_KEYWORDS].reduce<Record<string, string>>(
      (acc, k) => { acc[k.id] = k.label; return acc; },
      {}
    );
    const keywordLabels = selected.map((id) => labelMap[id]);

    try {
      // Fetch a fresh Firebase ID token — verified server-side, userId never sent in body
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("You must be signed in to use AI Assist.");
        return;
      }
      const idToken = await currentUser.getIdToken();

      const res = await fetch("/api/ai-assist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({ poemContent, keywords: keywordLabels }),
      });

      const data = await res.json() as { suggestion?: string; remaining?: number; error?: string };

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSuggestion(data.suggestion ?? "");
      if (data.remaining !== undefined) setRemaining(data.remaining);
    } catch {
      setError("Network error — please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  /** Called when user clicks "Use This Poem" */
  const handleAcceptClick = () => {
    if (!suggestion) return;
    // If the user already has content, require them to choose replace vs. append
    if (poemContent.trim()) {
      setConfirmOverwrite(true);
    } else {
      // No existing content — safe to replace directly
      onAccept(suggestion, "replace");
      handleClose();
    }
  };

  const handleConfirm = (mode: "replace" | "append") => {
    if (suggestion) {
      onAccept(suggestion, mode);
      handleClose();
    }
  };

  const handleClose = () => {
    // Reset state on close
    setSelected([]);
    setSuggestion(null);
    setError(null);
    setLoading(false);
    setConfirmOverwrite(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="ai-dialog-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
          onClick={handleClose}
        >
          <motion.div
            key="ai-dialog-panel"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-[#0d0d0d] border border-neutral-800 shadow-2xl overflow-hidden"
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 shrink-0 bg-gradient-to-r from-indigo-950/40 to-violet-950/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Wand2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">AI Poetry Assistant</h2>
                  <p className="text-[10px] text-neutral-500">
                    Powered by Gemini · {remaining !== null ? `${remaining} uses left this hour` : `${MAX_KEYWORDS} keywords max`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-neutral-500 hover:text-white transition-colors rounded-full p-1 hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Scrollable Body ── */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

              {/* Selection counter */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-400">
                  Select up to <span className="text-white font-semibold">4 keywords</span> to guide the AI
                </p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  selected.length === MAX_KEYWORDS
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-600/40"
                    : "bg-neutral-800 text-neutral-400"
                }`}>
                  {selected.length}/{MAX_KEYWORDS}
                </span>
              </div>

              {/* Mood / Theme */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block" />
                  Mood &amp; Theme
                </p>
                <div className="flex flex-wrap gap-2">
                  {MOOD_KEYWORDS.map((kw) => (
                    <KeywordChip
                      key={kw.id}
                      label={kw.label}
                      emoji={kw.emoji}
                      selected={selected.includes(kw.id)}
                      disabled={!selected.includes(kw.id) && selected.length >= MAX_KEYWORDS}
                      onClick={() => toggleKeyword(kw.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Style / Flow */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block" />
                  Style &amp; Flow
                </p>
                <div className="flex flex-wrap gap-2">
                  {STYLE_KEYWORDS.map((kw) => (
                    <KeywordChip
                      key={kw.id}
                      label={kw.label}
                      emoji={kw.emoji}
                      selected={selected.includes(kw.id)}
                      disabled={!selected.includes(kw.id) && selected.length >= MAX_KEYWORDS}
                      onClick={() => toggleKeyword(kw.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Current poem notice */}
              {poemContent.trim() ? (
                <p className="text-[11px] text-neutral-500 bg-neutral-900 rounded-lg px-3 py-2 border border-neutral-800">
                  ✏️ AI will enhance your existing poem using the selected keywords.
                </p>
              ) : (
                <p className="text-[11px] text-amber-500/80 bg-amber-950/20 rounded-lg px-3 py-2 border border-amber-800/30">
                  🖊️ No poem written yet — AI will compose an original poem for you.
                </p>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* AI Result */}
              {suggestion && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> AI Suggestion
                  </p>
                  <div className="rounded-xl bg-neutral-900 border border-neutral-700 p-4 max-h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-serif text-sm text-neutral-200 leading-7 text-center">
                      {suggestion}
                    </pre>
                  </div>
                </motion.div>
              )}
            </div>

            {/* ── Footer actions ── */}
            <div className="shrink-0 px-5 py-4 border-t border-neutral-800 bg-neutral-950/60">
              {/* Overwrite confirmation — shown after user clicks "Use This Poem" */}
              {confirmOverwrite ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <p className="text-xs text-amber-400 text-center font-semibold mb-2">
                    ⚠️ You have existing poem content. What would you like to do?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleConfirm("append")}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Append Below
                    </button>
                    <button
                      onClick={() => handleConfirm("replace")}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-red-700 hover:bg-red-600 text-white transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Replace All
                    </button>
                  </div>
                  <button
                    onClick={() => setConfirmOverwrite(false)}
                    className="w-full py-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    Cancel
                  </button>
                </motion.div>
              ) : suggestion ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleGenerate}
                    disabled={loading || !selected.length}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Regenerate
                  </button>
                  <button
                    onClick={handleAcceptClick}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Use This Poem
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={loading || !selected.length}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white transition-all shadow-lg shadow-indigo-500/20 disabled:shadow-none"
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      >
                        <Sparkles className="w-4 h-4" />
                      </motion.div>
                      Generating your poem…
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      {selected.length ? "Generate with AI" : "Select keywords to begin"}
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
