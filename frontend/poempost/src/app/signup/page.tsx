'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signUp, signInWithGoogle } from '@/lib/authService';
import { LampContainer } from '@/components/ui/lamp';
import { motion } from 'motion/react';

function SignUpPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect')?.startsWith('/')
    ? searchParams.get('redirect')
    : '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSignUp = async () => {
    setError('');

    if (!fullName.trim()) { setError('Please enter your name.'); return; }
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const result = await signUp(email, password, fullName.trim());
      if (result.success) {
        router.push(redirectTo || '/dashboard');
      } else {
        setError(result.error || 'Sign up failed. Please try again.');
      }
    } catch (err) {
      console.error('Sign up error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      // Desktop popup: navigate immediately; mobile redirect: handled post-redirect
      if (result.success && result.user) {
        router.push(redirectTo || '/dashboard');
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <LampContainer className="pt-80 overflow-hidden">
      <div className="flex flex-col items-center justify-center">
        <motion.h1
          initial={{ opacity: 0.5, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: 'easeInOut' }}
          className="bg-gradient-to-br from-slate-300 to-slate-500 py-4 bg-clip-text text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl"
        >
          Join Us Today
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: 'easeInOut' }}
          className="w-full max-w-md"
        >
          <div className="pt-24" />

          <div className="relative backdrop-blur-xl bg-slate-900/20 border border-slate-700/50 rounded-2xl shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/20 via-transparent to-slate-900/20 rounded-2xl" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5" />

            <div className="relative z-10 p-8">
              <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent">
                Create Your Account
              </h2>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Full name"
                  className="w-full p-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400/70 focus:bg-slate-800/70 transition-all duration-300 backdrop-blur-sm disabled:opacity-50"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading || googleLoading}
                />

                <input
                  type="email"
                  placeholder="Email address"
                  className="w-full p-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400/70 focus:bg-slate-800/70 transition-all duration-300 backdrop-blur-sm disabled:opacity-50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || googleLoading}
                />

                <input
                  type="password"
                  placeholder="Password (min. 6 characters)"
                  className="w-full p-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400/70 focus:bg-slate-800/70 transition-all duration-300 backdrop-blur-sm disabled:opacity-50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || googleLoading}
                />

                <input
                  type="password"
                  placeholder="Confirm password"
                  className="w-full p-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400/70 focus:bg-slate-800/70 transition-all duration-300 backdrop-blur-sm disabled:opacity-50"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading || googleLoading}
                />
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={handleSignUp}
                  disabled={loading || googleLoading}
                  className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 p-4 text-white font-semibold transition-all duration-300 hover:from-cyan-500 hover:to-blue-500 hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10">
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                        Creating Account...
                      </div>
                    ) : (
                      'Create Account'
                    )}
                  </span>
                </button>

                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading || googleLoading}
                  className="w-full relative group overflow-hidden rounded-xl bg-slate-800/50 border border-slate-600/50 p-4 text-slate-100 font-semibold transition-all duration-300 hover:bg-slate-700/50 hover:border-slate-500/50 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10">
                    {googleLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-100 mr-2" />
                        Continuing...
                      </div>
                    ) : (
                      'Continue with Google'
                    )}
                  </span>
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-slate-400 text-sm">
                  Already have an account?{' '}
                  <a href={`/signin${redirectTo && redirectTo !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`} className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200">
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

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpPageContent />
    </Suspense>
  );
}
