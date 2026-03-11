'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { cn } from '@/lib/utils';
import Navbar from '@/components/ui/Navbar';
import { CardDemo } from '@/components/Card';
import { SparklesCore } from '@/components/ui/sparkles';
import MyPoems from '@/components/Mypoem';


export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('Auth State Changed:', currentUser);
      setUser(currentUser);
      setLoading(false);
      if (!currentUser) {
        router.push('/signin');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      console.log('Signed out successfully');
      router.push('/signin');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="relative flex min-h-screen w-full rounded-md bg-black/[0.96] antialiased md:items-center md:justify-center">
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-[-1] [background-size:40px_40px] select-none",
            "[background-image:linear-gradient(to_right,#171717_1px,transparent_1px),linear-gradient(to_bottom,#171717_1px,transparent_1px)]"
          )}
        />
        <div className="flex items-center justify-center h-screen">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-black/[0.96] antialiased">
      {/* Background Grid */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-0 [background-size:40px_40px] select-none",
          "[background-image:linear-gradient(to_right,#171717_1px,transparent_1px),linear-gradient(to_bottom,#171717_1px,transparent_1px)]"
        )}
      />
      
      {/* Navbar */}
      <Navbar
        userEmail={user?.email || 'user@example.com'}
        userPhoto={user?.photoURL || ''}
        onLogout={handleLogout}
      />
      
      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-start pt-24 min-h-screen space-y-6">
        <CardDemo />
        
        {/* Sparkles under the card */}
        <div className="relative w-full  h-40">
          {/* Decorative gradients */}
          <div className="absolute inset-x-0 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] blur-sm" />
          <div className="absolute inset-x-0 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px" />
          <div className="absolute inset-x-16 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[5px] blur-sm" />
          <div className="absolute inset-x-16 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px" />
          
          {/* Sparkles Core */}
          <SparklesCore
            background="transparent"
            minSize={0.4}
            maxSize={1}
            particleDensity={1200}
            className="w-full h-full"
            particleColor="#FFFFFF"
          />
          
          {/* Fade out with radial mask */}
          <div className="absolute inset-0 w-full h-full  [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]" />
        </div>
      
        <MyPoems/>
      </div>
    </div>
  );
}