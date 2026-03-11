// lib/authService.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  AuthError,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Your Firebase config
import { AuthResult } from '@/types/auth';

const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Add additional scopes if needed
googleProvider.addScope('email');
googleProvider.addScope('profile');

export const signUp = async (
  email: string, 
  password: string, 
  displayName?: string
): Promise<AuthResult> => {
  try {
    // Set persistence before creating user
    await setPersistence(auth, browserLocalPersistence);
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    return { 
      success: true, 
      user: userCredential.user,
      error: null 
    };
  } catch (error) {
    const authError = error as AuthError;
    console.error('Sign up error:', authError.code, authError.message);
    return { 
      success: false, 
      user: null, 
      error: getReadableErrorMessage(authError) 
    };
  }
};

export const signIn = async (email: string, password: string): Promise<AuthResult> => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { 
      success: true, 
      user: userCredential.user,
      error: null 
    };
  } catch (error) {
    const authError = error as AuthError;
    console.error('Sign in error:', authError.code, authError.message);
    return { 
      success: false, 
      user: null, 
      error: getReadableErrorMessage(authError) 
    };
  }
};

// Changed to use redirect instead of popup to avoid COOP issues
export const signInWithGoogle = async (): Promise<AuthResult> => {
  try {
    // Set persistence before redirect
    await setPersistence(auth, browserLocalPersistence);
    
    console.log('Starting Google sign-in redirect...');
    await signInWithRedirect(auth, googleProvider);
    
    // The actual result will be handled by getRedirectResult
    // in your component or a separate handler
    return { 
      success: true, 
      user: null, // Will be set after redirect
      error: null 
    };
  } catch (error) {
    const authError = error as AuthError;
    console.error('Google sign in error:', authError.code, authError.message);
    return { 
      success: false, 
      user: null, 
      error: getReadableErrorMessage(authError) 
    };
  }
};

// Helper function to handle redirect result
export const handleGoogleRedirectResult = async (): Promise<AuthResult | null> => {
  try {
    console.log('Checking for redirect result...');
    const result = await getRedirectResult(auth);
    
    if (result) {
      console.log('✅ Redirect result found:', result);
      if (result.user) {
        console.log('✅ User from redirect:', result.user.email);
        return {
          success: true,
          user: result.user,
          error: null,
        };
      }
    }
    
    console.log('⚠️ No redirect result found');
    return null;
  } catch (error) {
    const authError = error as AuthError;
    console.error('❌ Error in getRedirectResult:', authError.code, authError.message);
    return {
      success: false,
      user: null,
      error: getReadableErrorMessage(authError),
    };
  }
};

export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    const authError = error as AuthError;
    console.error('Logout error:', authError.code, authError.message);
    throw new Error(getReadableErrorMessage(authError));
  }
};

export const resetPassword = async (email: string): Promise<{ error: string | null }> => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error) {
    const authError = error as AuthError;
    console.error('Reset password error:', authError.code, authError.message);
    return { error: getReadableErrorMessage(authError) };
  }
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Helper function to convert Firebase error codes to user-friendly messages
const getReadableErrorMessage = (error: AuthError): string => {
  switch (error.code) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled.';
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Pop-up was blocked by the browser.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled.';
    case 'auth/invalid-credential':
      return 'Invalid credentials provided.';
    case 'auth/credential-already-in-use':
      return 'This credential is already associated with a different account.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
};

// Optional: Helper function to check if user email is verified
export const isEmailVerified = (): boolean => {
  return auth.currentUser?.emailVerified ?? false;
};

// Optional: Helper function to send email verification
export const sendEmailVerification = async (): Promise<{ error: string | null }> => {
  try {
    if (!auth.currentUser) {
      return { error: 'No user is currently signed in.' };
    }
    
    const { sendEmailVerification } = await import('firebase/auth');
    await sendEmailVerification(auth.currentUser);
    return { error: null };
  } catch (error) {
    const authError = error as AuthError;
    console.error('Email verification error:', authError.code, authError.message);
    return { error: getReadableErrorMessage(authError) };
  }
};