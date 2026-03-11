"use client";

import Navbar from "@/components/ui/Navbar";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signOut, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Meteors } from "@/components/ui/meteors";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { BackgroundGradient } from "@/components/ui/background-gradient";

const CreatePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [font, setFont] = useState("inter");
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

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

  const uploadImageToCloudinary = async () => {
    if (!image) return "";
    const formData = new FormData();
    formData.append("file", image);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET!);

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/" +
        process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME +
        "/image/upload",
      {
        method: "POST",
        body: formData,
      }
    );
    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !user) return;

    // Enforce rule: only one of text or image
    const isTextOnly = content.trim() !== "" && !image;
    const isImageOnly = !content.trim() && image;

    if (!isTextOnly && !isImageOnly) {
      alert("Please provide either a poem text OR an image — not both.");
      return;
    }

    setLoading(true);

    try {
      const uploadedImageUrl = image ? await uploadImageToCloudinary() : null;

      await addDoc(collection(db, "poems"), {
        title,
        content: isTextOnly ? content.trim() : "",
        font,
        imageUrl: uploadedImageUrl || null,
        createdAt: serverTimestamp(),
        authorId: user.uid,
        authorEmail: user.email,
        likes: [],
      });

      setTitle("");
      setContent("");
      setImage(null);
      setImageUrl("");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating poem:", error);
    } finally {
      setLoading(false);
    }
  };

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

        {/* Form container */}
        <div className="w-full max-w-xl mx-auto pt-8 px-4">
          <BackgroundGradient className="w-full rounded-2xl p-[1px]">
            <div className="w-full rounded-2xl bg-neutral-900 px-5 py-6 space-y-5 border border-white/10">
              <h1 className="text-xl font-bold text-white text-center">
                Create a New Poem
              </h1>

              <form onSubmit={handleSubmit} className="w-full space-y-5">
                <div>
                  <label className="block text-lg mb-1 text-white">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-neutral-800 text-white border border-neutral-700"
                    placeholder="Enter poem title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-lg text-white mb-1">Font</label>
                  <select
                  title="b"
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

                <div>
                  <label className="block text-lg text-white mb-1">Poem</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={3}
                    className={`w-full px-3 py-2 rounded bg-neutral-800 text-white border border-neutral-700 font-${font}`}
                    placeholder="Write your poem here..."
                  />
                </div>

                <div>
                  <label className="block text-lg text-white mb-1">Image (optional)</label>
                  <input
                  title="d"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                    className="block text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 rounded bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold"
                >
                  {loading ? "Uploading..." : "Post Poem"}
                </button>
              </form>

              {/* Preview */}
              <div className="mt-6 w-full border-t border-neutral-700 pt-4">
                <h2 className="text-lg font-bold text-white mb-2">Preview</h2>
                <div className={`text-xl font-${font} whitespace-pre-line`}>
                  <h3 className="text-2xl mb-2">{title}</h3>
                  <p>{content}</p>
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
    </div>
  );
};

export default CreatePage;

