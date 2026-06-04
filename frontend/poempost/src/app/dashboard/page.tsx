'use client';

import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import Navbar from '@/components/ui/Navbar';
import { CardDemo } from '@/components/Card';
import { SparklesCore } from '@/components/ui/sparkles';
import MyPoems from '@/components/Mypoem';

export default function Dashboard() {
  const { currentUser: user, logOut } = useAuth();

  return (
    <div className="relative min-h-screen w-full bg-black/[0.96] antialiased">
      {/* Background Grid */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 z-0 [background-size:40px_40px] select-none',
          '[background-image:linear-gradient(to_right,#171717_1px,transparent_1px),linear-gradient(to_bottom,#171717_1px,transparent_1px)]'
        )}
      />

      {/* Navbar */}
      <Navbar
        userEmail={user?.email || ''}
        userPhoto={user?.photoURL || ''}
        onLogout={logOut}
      />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-start pt-24 min-h-screen space-y-6">
        <CardDemo />

        {/* Sparkles divider */}
        <div className="relative w-full h-40">
          <div className="absolute inset-x-0 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] blur-sm" />
          <div className="absolute inset-x-0 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px" />
          <div className="absolute inset-x-16 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[5px] blur-sm" />
          <div className="absolute inset-x-16 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px" />

          <SparklesCore
            background="transparent"
            minSize={0.4}
            maxSize={1}
            particleDensity={1200}
            className="w-full h-full"
            particleColor="#FFFFFF"
          />

          <div className="absolute inset-0 w-full h-full [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]" />
        </div>

        <MyPoems />
      </div>
    </div>
  );
}