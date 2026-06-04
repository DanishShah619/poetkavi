'use client';

import { AnimatedText } from "@/components/ui/color-generate";
import { Spotlight } from "@/components/ui/spotlight";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function Home() {
  const router = useRouter();

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
            <div className="grid gap-6 md:grid-cols-3">
              <div className="p-6 bg-neutral-900/50 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-all duration-300 backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-neutral-200 mb-3">The Silent Dawn</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">A poem about the quiet beauty of morning...</p>
              </div>
              <div className="p-6 bg-neutral-900/50 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-all duration-300 backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-neutral-200 mb-3">Ocean&apos;s Whisper</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">Waves carry stories of distant shores...</p>
              </div>
              <div className="p-6 bg-neutral-900/50 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-all duration-300 backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-neutral-200 mb-3">City Lights</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">Urban poetry about the rhythm of life...</p>
              </div>
            </div>
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
    </div>
  );
}
