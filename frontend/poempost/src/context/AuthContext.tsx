// contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
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
  const [initializing, setInitializing] = useState(true);
  const [hasProcessedRedirect, setHasProcessedRedirect] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChange((user) => {
      if (mounted) {
        console.log('Auth state changed:', user?.email || 'No user');
        setCurrentUser(user);
        setLoading(false);
        
        // If user is authenticated and we haven't processed redirect yet, navigate to dashboard
        if (user && !hasProcessedRedirect) {
          console.log('Navigating to dashboard for authenticated user');
          setHasProcessedRedirect(true);
          router.push('/dashboard');
        }
          
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [router, hasProcessedRedirect]);

  // Handle Google redirect result on app initialization
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        console.log('Checking for Google redirect result...');
        const result = await handleGoogleRedirectResult();
        
        if (result && result.success && result.user) {
          console.log('Google sign-in successful via redirect:', result.user.email);
          // Don't navigate here - let the auth state change handler do it
          // The auth state change will trigger navigation
        } else if (result && result.error) {
          console.error('Google redirect error:', result.error);
        } else {
          console.log('No redirect result found');
        }
      } catch (error) {
        console.error('Error handling Google redirect:', error);
      } finally {
        setInitializing(false);
      }
    };

    handleRedirect();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string): Promise<AuthResult> => {
    try {
      const result = await authSignUp(email, password, displayName);
      if (result.success) {
        // Navigation will be handled by auth state change
        console.log('Sign up successful');
      }
      return result;
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Sign up failed' };
    }
  };

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const result = await authSignIn(email, password);
      if (result.success) {
        // Navigation will be handled by auth state change
        console.log('Sign in successful');
      }
      return result;
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Sign in failed' };
    }
  };

  const signInWithGoogle = async (): Promise<AuthResult> => {
    try {
      console.log('Initiating Google sign-in...');
      return await authSignInWithGoogle();
    } catch (error) {
      console.error('Google sign in error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Google sign in failed' };
    }
  };

  const logOut = async (): Promise<void> => {
    try {
      await authLogOut();
      setHasProcessedRedirect(false); // Reset for next sign-in
      router.push('/signin'); // Redirect to sign-in page
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
      return { error: error instanceof Error ? error.message : 'Reset password failed' };
    }
  };

  const value: AuthContextType = {
    currentUser,
    isAuthenticated: !!currentUser,
    loading: loading || initializing,
    signUp,
    signIn,
    signInWithGoogle,
    logOut,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && !initializing && children}
    </AuthContext.Provider>
  );
};