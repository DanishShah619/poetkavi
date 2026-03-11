'use client';
import { AnimatedText } from "@/components/ui/color-generate";
import { Spotlight } from "@/components/ui/spotlight";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Router } from "lucide-react";


export default function Home() {
  const router = useRouter();
  return (
    <div className="relative flex min-h-screen w-full rounded-md bg-black/[0.96] antialiased md:items-center md:justify-center">
  <div
    className={cn(
      "pointer-events-none absolute inset-0 [background-size:40px_40px] select-none",
      "[background-image:linear-gradient(to_right,#171717_1px,transparent_1px),linear-gradient(to_bottom,#171717_1px,transparent_1px)]",
    )}
  />
  <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="white"/>
  
  <div className="relative z-10 mx-auto w-full max-w-7xl p-4">
    {/* Hero section - centered on screen */}
    <div className="flex flex-col items-center justify-center min-h-screen">
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="bg-opacity-50 bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-center text-4xl font-bold text-transparent md:text-7xl">
        PoemKavi <br />
      </h1>
      <p className="mx-auto mt-4 max-w-lg text-center text-base font-normal text-neutral-300">
        You Write The Word,We Spread It
      </p>
    </div>
    
    {/* Content below the hero section */}
    <div className="pb-20">
    {/* Content below the hero section */}
    <div className="pb-20">
      {/* AnimatedText positioned below the hero */}
      <div className="mb-20">
        <AnimatedText 
          words="PoemKavi is a platform where you can share your poems and read others' works. Join us to explore the world of poetry!" 
        
          effect="both" 
          staggerDelay={0.002}
        />
      </div>
      
      {/* Featured Poems section */}
      <div className="mb-20 text-center">
        <h2 className="text-3xl font-bold text-neutral-100 mb-8">Featured Poems</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 bg-neutral-900/50 rounded-lg border border-neutral-800">
            <h3 className="text-xl font-semibold text-neutral-200 mb-3">The Silent Dawn</h3>
            <p className="text-neutral-400 text-sm">A poem about the quiet beauty of morning...</p>
          </div>
          <div className="p-6 bg-neutral-900/50 rounded-lg border border-neutral-800">
            <h3 className="text-xl font-semibold text-neutral-200 mb-3">Ocean's Whisper</h3>
            <p className="text-neutral-400 text-sm">Waves carry stories of distant shores...</p>
          </div>
          <div className="p-6 bg-neutral-900/50 rounded-lg border border-neutral-800">
            <h3 className="text-xl font-semibold text-neutral-200 mb-3">City Lights</h3>
            <p className="text-neutral-400 text-sm">Urban poetry about the rhythm of life...</p>
          </div>
        </div>
      </div>
      
      {/* Join Community section */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-neutral-100 mb-8">Join Our Community</h2>
        <p className="text-neutral-300 max-w-2xl mx-auto mb-8">
          Connect with fellow poets, share your work, and discover new voices in poetry. 
          Whether you're a seasoned writer or just starting your journey, PoemKavi welcomes all.
        </p>
        <button onClick= {()=>router.push('/signup')} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200" >
          Start Writing
        </button>
         <button onClick= {()=>router.push('/signin')} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200" >
          Get Back To Writing
        </button>
      </div>
    </div>
  </div>
</div>
</div>
</div>
  );
}
