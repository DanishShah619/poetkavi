"use client";

import Navbar from "@/components/ui/Navbar";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Meteors } from "@/components/ui/meteors";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { BackgroundGradient } from "@/components/ui/background-gradient";
import { useAuth } from "@/context/AuthContext";
import { AIAssistDialog } from "@/components/AIAssistDialog";
import { Wand2 } from "lucide-react";

const TITLE_MAX = 120;
const CONTENT_MAX = 5000;

const CreatePage: React.FC = () => {
  const { currentUser: user, loading, logOut } = useAuth();
  const router = useRouter();

  const [title, setTitle]         = useState("");
  const [content, setContent]     = useState("");
  const [font, setFont]           = useState("inter");
  const [image, setImage]         = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [showAIDialog, setShowAIDialog] = useState(false);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [loading, user, router]);

  const uploadImageToCloudinary = async (): Promise<string> => {
    if (!image) return "";
    const formData = new FormData();
    formData.append("file", image);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET!);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || "Image upload failed. Please try again.");
    }
    return data.secure_url as string;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Auth guard
    if (!user) { router.push("/signin"); return; }

    // Validation
    if (!title.trim()) { setError("Title is required."); return; }
    if (title.trim().length > TITLE_MAX) { setError(`Title must be under ${TITLE_MAX} characters.`); return; }

    const hasText = content.trim() !== "";
    const hasImage = !!image;

    if (!hasText && !hasImage) { setError("Please provide either a poem text or an image."); return; }
    if (hasText && hasImage) { setError("Please provide either a poem text OR an image — not both."); return; }
    if (hasText && content.length > CONTENT_MAX) { setError(`Poem must be under ${CONTENT_MAX} characters.`); return; }

    setSubmitting(true);

    try {
      const uploadedImageUrl = hasImage ? await uploadImageToCloudinary() : null;

      await addDoc(collection(db, "poems"), {
        title: title.trim(),
        content: hasText ? content.trim() : "",
        font,
        imageUrl: uploadedImageUrl || null,
        createdAt: serverTimestamp(),
        authorId: user.uid,
        // authorName for display; authorEmail retained for legacy read fallback
        authorName: user.displayName || user.email?.split("@")[0] || "Poet",
        authorEmail: user.email,
        likes: [],
      });

      router.push("/dashboard");
    } catch (err: unknown) {
      console.error("Error creating poem:", err);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Don't render form until auth is resolved
  if (loading) return null;
  if (!user) return null;

  return (
    <div className="relative min-h-screen w-full bg-black/[0.96] antialiased">
      {/* Grid background */}
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

        <div className="w-full max-w-xl mx-auto pt-8 px-4">
          <BackgroundGradient className="w-full rounded-2xl p-[1px]">
            <div className="w-full rounded-2xl bg-neutral-900 px-5 py-6 space-y-5 border border-white/10">
              <h1 className="text-xl font-bold text-white text-center">
                Create a New Poem
              </h1>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="w-full space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-lg mb-1 text-white">
                    Title{" "}
                    <span className="text-sm text-neutral-400">
                      ({title.length}/{TITLE_MAX})
                    </span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    maxLength={TITLE_MAX}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-neutral-800 text-white border border-neutral-700 focus:border-indigo-500 focus:outline-none"
                    placeholder="Enter poem title"
                    required
                  />
                </div>

                {/* Font */}
                <div>
                  <label className="block text-lg text-white mb-1">Font</label>
                  <select
                    value={font}
                    onChange={(e) => setFont(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-neutral-800 text-white border border-neutral-700"
                  >
                    <option value="inter">Inter</option>
                    <option value="serif">Serif</option>
                    <option value="dancing">Dancing Script</option>
                    <option value="handwriting">Handwriting</option>
                    <option value="greatvibes">Great Vibes</option>
                    <option value="cinzel">Cinzel Decorative</option>
                    <option value="indie">Indie Flower</option>
                  </select>
                </div>

                {/* Poem text */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-lg text-white">
                      Poem{" "}
                      <span className="text-sm text-neutral-400">
                        ({content.length}/{CONTENT_MAX})
                      </span>
                    </label>

                    {/* ✨ AI Assist button */}
                    <button
                      type="button"
                      onClick={() => setShowAIDialog(true)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 hover:border-indigo-500/60 text-indigo-300 hover:text-white transition-all duration-200"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      AI Assist
                    </button>
                  </div>
                  <textarea
                    value={content}
                    maxLength={CONTENT_MAX}
                    onChange={(e) => setContent(e.target.value)}
                    rows={6}
                    className={`w-full px-3 py-2 rounded bg-neutral-800 text-white border border-neutral-700 font-${font} focus:border-indigo-500 focus:outline-none`}
                    placeholder="Write your poem here…"
                  />
                </div>

                {/* Image */}
                <div>
                  <label className="block text-lg text-white mb-1">
                    Image <span className="text-neutral-400 text-sm">(optional — provide image OR text, not both)</span>
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                    className="block text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2 px-4 rounded bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold transition-colors"
                >
                  {submitting ? "Uploading..." : "Post Poem"}
                </button>
              </form>

              {/* Preview */}
              <div className="mt-6 w-full border-t border-neutral-700 pt-4">
                <h2 className="text-lg font-bold text-white mb-2">Preview</h2>
                <div className={`text-xl whitespace-pre-line font-${font}`}>
                  <h3 className="text-2xl mb-2 text-white">{title}</h3>
                  <p className="text-neutral-300">{content}</p>
                  {image && (
                    <p className="mt-4 text-sm italic text-gray-400">
                      (Image selected: {image.name})
                    </p>
                  )}
                </div>
              </div>
            </div>
          </BackgroundGradient>
        </div>
      </Meteors>
      {/* AI Assist Dialog */}
      <AIAssistDialog
        open={showAIDialog}
        onClose={() => setShowAIDialog(false)}
        poemContent={content}
        onAccept={(suggestion, mode) => {
          if (mode === "append") {
            setContent((prev) => prev ? `${prev}\n\n---\n\n${suggestion}` : suggestion);
          } else {
            setContent(suggestion);
          }
        }}
      />
    </div>
  );
};

export default CreatePage;
