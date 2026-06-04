'use client';

import { useState } from 'react';
import { resetPassword } from '@/lib/authService';
import { LampContainer } from '@/components/ui/lamp';
import { motion } from 'motion/react';

export default function ForgotPasswordPage() {

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await resetPassword(email);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Password reset link sent to your email.');
        setEmail('');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleReset(e as unknown as React.FormEvent);
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
          Reset Password
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
                Recover Your Account
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

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-300 text-sm"
                >
                  {success}
                </motion.div>
              )}

              <form onSubmit={handleReset} className="space-y-4">
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Email address"
                    className="w-full p-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400/70 focus:bg-slate-800/70 transition-all duration-300 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    required
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/5 to-blue-500/5 pointer-events-none opacity-0 focus-within:opacity-100 transition-opacity duration-300" />
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 p-4 text-white font-semibold transition-all duration-300 hover:from-cyan-500 hover:to-blue-500 hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative z-10">
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                          Sending...
                        </div>
                      ) : (
                        'Send Reset Email'
                      )}
                    </span>
                  </button>
                </div>
              </form>

              <div className="mt-6 text-center space-y-2">
                <p className="text-slate-400 text-sm">
                  Remember your password?{' '}
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
