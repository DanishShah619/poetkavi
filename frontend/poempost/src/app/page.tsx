'use client';

import { AnimatedText } from "@/components/ui/color-generate";
import { Spotlight } from "@/components/ui/spotlight";
import { Github, Instagram, Mail, Phone } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type FeaturedPoem = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
};

const FEATURED_AUTHOR_NAME = "shanildanshah";
const FEATURED_POEM_LIMIT = 3;
const OWNER_NAME = "Danish Shah";
const OWNER_EMAIL = "shanildanshah@gmail.com";
const OWNER_PHONE = "+91 9123707332";
const OWNER_GITHUB_URL = "https://github.com/DanishShah619";
const OWNER_INSTAGRAM_URL = "https://www.instagram.com/danish_shanil/";

const footerLinks = [
  {
    label: "GitHub",
    href: OWNER_GITHUB_URL,
    icon: Github,
  },
  {
    label: "Gmail",
    href: `mailto:${OWNER_EMAIL}`,
    icon: Mail,
  },
  {
    label: "Phone",
    href: OWNER_PHONE ? `tel:${OWNER_PHONE.replace(/[^\d+]/g, "")}` : null,
    icon: Phone,
  },
  {
    label: "Instagram",
    href: OWNER_INSTAGRAM_URL,
    icon: Instagram,
  },
];

export default function Home() {
  const router = useRouter();
  const [featuredPoems, setFeaturedPoems] = useState<FeaturedPoem[]>([]);
  const [isLoadingFeaturedPoems, setIsLoadingFeaturedPoems] = useState(true);
  const [featuredPoemsError, setFeaturedPoemsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFeaturedPoems() {
      try {
        const response = await fetch(
          `/api/featured-poems?author=${encodeURIComponent(FEATURED_AUTHOR_NAME)}&limit=${FEATURED_POEM_LIMIT}`
        );

        if (!response.ok) {
          throw new Error(`Featured poems request failed: ${response.status}`);
        }

        const { poems } = (await response.json()) as { poems: FeaturedPoem[] };

        if (isMounted) {
          setFeaturedPoems(Array.isArray(poems) ? poems : []);
          setFeaturedPoemsError(null);
        }
      } catch (error) {
        console.error("Failed to load featured poems:", error);
        if (isMounted) {
          setFeaturedPoemsError("Featured poems are temporarily unavailable.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingFeaturedPoems(false);
        }
      }
    }

    loadFeaturedPoems();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="relative flex min-h-screen w-full bg-black/[0.96] antialiased flex-col items-center">
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-0 [background-size:40px_40px] select-none",
          "[background-image:linear-gradient(to_right,#171717_1px,transparent_1px),linear-gradient(to_bottom,#171717_1px,transparent_1px)]"
        )}
      />
      <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="white" />

      <div className="relative z-10 mx-auto w-full max-w-7xl p-4 flex flex-col items-center">
        {/* Hero section */}
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
          <h1 className="bg-opacity-50 bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-4xl font-bold text-transparent md:text-8xl tracking-tight">
            PoemKavi
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-lg text-neutral-300 font-medium">
            You Write The Word, We Spread It
          </p>
        </div>

        {/* Content below the hero section */}
        <div className="w-full pb-24 max-w-4xl">
          {/* AnimatedText positioned below the hero */}
          <div className="mb-24 text-center">
            <AnimatedText
              words="PoemKavi is a platform where you can share your poems and read others' works. Join us to explore the world of poetry!"
              effect="both"
              staggerDelay={0.002}
            />
          </div>

          {/* Featured Poems section */}
          <div className="mb-24 text-center">
            <h2 className="text-3xl font-bold text-neutral-100 mb-10 tracking-tight">Featured Poems</h2>
            {isLoadingFeaturedPoems ? (
              <div className="grid gap-6 md:grid-cols-3">
                {Array.from({ length: FEATURED_POEM_LIMIT }).map((_, index) => (
                  <div
                    key={index}
                    className="min-h-40 rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 backdrop-blur-sm"
                  >
                    <div className="mb-4 h-5 w-3/4 rounded bg-neutral-800" />
                    <div className="space-y-2">
                      <div className="h-3 rounded bg-neutral-800/80" />
                      <div className="h-3 rounded bg-neutral-800/70" />
                      <div className="h-3 w-2/3 rounded bg-neutral-800/60" />
                    </div>
                  </div>
                ))}
              </div>
            ) : featuredPoemsError ? (
              <p className="rounded-xl border border-neutral-800 bg-neutral-900/40 px-5 py-4 text-sm text-neutral-400">
                {featuredPoemsError}
              </p>
            ) : featuredPoems.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-3">
                {featuredPoems.map((poem) => (
                  <article
                    key={poem.id}
                    className="flex min-h-40 flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50 text-left backdrop-blur-sm transition-all duration-300 hover:border-neutral-700"
                  >
                    {poem.imageUrl ? (
                      <Image
                        src={poem.imageUrl}
                        alt={poem.title}
                        width={600}
                        height={240}
                        className="h-36 w-full object-cover"
                      />
                    ) : null}
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="mb-3 text-xl font-semibold text-neutral-200">
                        {poem.title}
                      </h3>
                      <p className="line-clamp-5 whitespace-pre-line text-sm leading-relaxed text-neutral-400">
                        {poem.content || "Image poem by shanildanshah."}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-neutral-800 bg-neutral-900/40 px-5 py-4 text-sm text-neutral-400">
                No featured poems from shanildanshah are available yet.
              </p>
            )}
          </div>

          {/* Join Community section */}
          <div className="text-center bg-neutral-900/30 rounded-2xl border border-neutral-800/80 p-8 md:p-12 backdrop-blur-sm">
            <h2 className="text-3xl font-bold text-neutral-100 mb-6 tracking-tight">Join Our Community</h2>
            <p className="text-neutral-300 max-w-2xl mx-auto mb-8 leading-relaxed">
              Connect with fellow poets, share your work, and discover new voices in poetry.
              Whether you&apos;re a seasoned writer or just starting your journey, PoemKavi welcomes all.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => router.push('/signup')}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-indigo-500/25 transition-all duration-200"
              >
                Start Writing
              </button>
              <button
                onClick={() => router.push('/signin')}
                className="px-8 py-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white rounded-lg font-semibold transition-all duration-200"
              >
                Get Back To Writing
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="relative z-10 w-full border-t border-neutral-800/80 bg-black/30 px-4 py-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-6 text-center text-sm text-neutral-400 sm:flex-row sm:text-left">
          <div>
            <p className="font-medium text-neutral-200">PoemKavi</p>
            <p>You Write The Word, We Spread It.</p>
          </div>

          <div className="flex flex-col items-center gap-3 sm:items-end">
            <p>
              Developed by <span className="font-medium text-neutral-200">{OWNER_NAME}</span>
            </p>
            <div className="flex items-center gap-3">
              {footerLinks.map(({ label, href, icon: Icon }) =>
                href ? (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={href.startsWith("http") ? "noreferrer" : undefined}
                    aria-label={label}
                    title={label}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900/70 text-neutral-300 transition-colors hover:border-neutral-600 hover:bg-neutral-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 focus:ring-offset-black"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                ) : (
                  <span
                    key={label}
                    aria-label={`${label} not configured`}
                    title={`${label} not configured`}
                    className="inline-flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-lg border border-neutral-900 bg-neutral-950/70 text-neutral-700"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
