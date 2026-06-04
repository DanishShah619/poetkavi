// contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import {
  signUp as authSignUp,
  signIn as authSignIn,
  signInWithGoogle as authSignInWithGoogle,
  handleGoogleRedirectResult,
  logOut as authLogOut,
  resetPassword as authResetPassword,
  onAuthStateChange
} from '@/lib/authService';
import { AuthContextType, AuthResult } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Pages where an authenticated user should be redirected away from */
const AUTH_ONLY_PATHS = ['/', '/signin', '/signup'];

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    handleGoogleRedirectResult().catch((err) => {
      console.error('Error processing Google redirect:', err);
    });
    // Result is picked up automatically by onAuthStateChanged below
  }, []);

  // Single auth state listener — source of truth for the whole app
  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChange((user) => {
      if (!mounted) return;

      setCurrentUser(user);
      setLoading(false);

      // Only redirect to dashboard if the user is on an auth-only page
      // This prevents trapping the user on /dashboard when navigating to /explore etc.
      if (user && AUTH_ONLY_PATHS.includes(pathname)) {
        router.push('/dashboard');
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [router, pathname]);

  const signUp = async (
    email: string,
    password: string,
    displayName?: string
  ): Promise<AuthResult> => {
    try {
      return await authSignUp(email, password, displayName);
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign up failed',
      };
    }
  };

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    try {
      return await authSignIn(email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign in failed',
      };
    }
  };

  const signInWithGoogle = async (): Promise<AuthResult> => {
    try {
      return await authSignInWithGoogle();
    } catch (error) {
      console.error('Google sign in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Google sign-in failed',
      };
    }
  };

  const logOut = async (): Promise<void> => {
    try {
      await authLogOut();
      router.push('/signin');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    try {
      return await authResetPassword(email);
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        error: error instanceof Error ? error.message : 'Reset password failed',
      };
    }
  };

  const value: AuthContextType = {
    currentUser,
    isAuthenticated: !!currentUser,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};