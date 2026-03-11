'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../lib/firebase'; // adjust if needed
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { LampContainer } from '@/components/ui/lamp';
import { motion } from 'motion/react';

export default function SignUpPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, {
        displayName: fullName,
      });
      localStorage.setItem('userName', fullName);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      localStorage.setItem('userName', result.user.displayName || '');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <LampContainer className="pt-80 overflow-hidden">
      <div className="flex flex-col items-center justify-center">
        <motion.h1
          initial={{ opacity: 0.5, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: 'easeInOut',
          }}
          className="bg-gradient-to-br from-slate-300 to-slate-500 py-4 bg-clip-text text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl"
        >
          Join Us Today
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.6,
            duration: 0.8,
            ease: 'easeInOut',
          }}
          className="w-full max-w-md "
        >
          <div className="pt-24" />

          <div className="relative backdrop-blur-xl bg-slate-900/20 border border-slate-700/50 rounded-2xl shadow-2xl ">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/20 via-transparent to-slate-900/20 rounded-2xl"></div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5"></div>

            <div className="relative z-10 p-8">
              <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent">
                Create Your Account
              </h2>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Full name"
                  className="w-full p-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400/70 focus:bg-slate-800/70 transition-all duration-300 backdrop-blur-sm"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />

                <input
                  type="email"
                  placeholder="Email address"
                  className="w-full p-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400/70 focus:bg-slate-800/70 transition-all duration-300 backdrop-blur-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <input
                  type="password"
                  placeholder="Password"
                  className="w-full p-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400/70 focus:bg-slate-800/70 transition-all duration-300 backdrop-blur-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <input
                  type="password"
                  placeholder="Confirm password"
                  className="w-full p-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400/70 focus:bg-slate-800/70 transition-all duration-300 backdrop-blur-sm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={handleSignUp}
                  className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 p-4 text-white font-semibold transition-all duration-300 hover:from-cyan-500 hover:to-blue-500 hover:shadow-lg hover:shadow-cyan-500/25"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10">Create Account</span>
                </button>

                <button
                  onClick={handleGoogleSignIn}
                  className="w-full relative group overflow-hidden rounded-xl bg-slate-800/50 border border-slate-600/50 p-4 text-slate-100 font-semibold transition-all duration-300 hover:bg-slate-700/50 hover:border-slate-500/50 backdrop-blur-sm"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10">Continue with Google</span>
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-slate-400 text-sm">
                  Already have an account?{' '}
                  <a href="/signin" className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200">
                    Sign in
                  </a>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </LampContainer>
  );
}
