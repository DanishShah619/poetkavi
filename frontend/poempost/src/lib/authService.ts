// lib/authService.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
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
import { auth } from '@/lib/firebase';
import { AuthResult } from '@/types/auth';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
googleProvider.addScope('email');
googleProvider.addScope('profile');

/**
 * Detects mobile browsers and WebViews where popups are blocked.
 * Uses redirect flow for these environments.
 */
const isMobileOrWebView = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isWebView = /(wv|WebView)/i.test(ua) || 
    (ua.includes('Android') && ua.includes('Version/') && !ua.includes('Chrome'));
  return isMobile || isWebView;
};

export const signUp = async (
  email: string,
  password: string,
  displayName?: string
): Promise<AuthResult> => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    return { success: true, user: userCredential.user, error: null };
  } catch (error) {
    const authError = error as AuthError;
    console.error('Sign up error:', authError.code, authError.message);
    return { success: false, user: null, error: getReadableErrorMessage(authError) };
  }
};

export const signIn = async (email: string, password: string): Promise<AuthResult> => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user, error: null };
  } catch (error) {
    const authError = error as AuthError;
    console.error('Sign in error:', authError.code, authError.message);
    return { success: false, user: null, error: getReadableErrorMessage(authError) };
  }
};

/**
 * Google sign-in:
 * - Desktop: signInWithPopup (immediate result)
 * - Mobile / WebView: signInWithRedirect (result handled on next page load via handleGoogleRedirectResult)
 */
export const signInWithGoogle = async (): Promise<AuthResult> => {
  try {
    await setPersistence(auth, browserLocalPersistence);

    if (isMobileOrWebView()) {
      // Redirect flow — result is picked up by handleGoogleRedirectResult on next load
      await signInWithRedirect(auth, googleProvider);
      // This line only reached if redirect somehow doesn't navigate away
      return { success: true, user: null, error: null };
    }

    // Popup flow — immediate result
    const result = await signInWithPopup(auth, googleProvider);
    return { success: true, user: result.user, error: null };
  } catch (error) {
    const authError = error as AuthError;
    console.error('Google sign in error:', authError.code, authError.message);
    return { success: false, user: null, error: getReadableErrorMessage(authError) };
  }
};

/**
 * Called once on app initialization to handle the result of signInWithRedirect.
 * Returns null if no redirect result is pending (desktop popup flow).
 */
export const handleGoogleRedirectResult = async (): Promise<AuthResult | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      return { success: true, user: result.user, error: null };
    }
    return null; // No pending redirect — normal for desktop popup flow
  } catch (error) {
    const authError = error as AuthError;
    console.error('Redirect result error:', authError.code, authError.message);
    return { success: false, user: null, error: getReadableErrorMessage(authError) };
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

export const isEmailVerified = (): boolean => {
  return auth.currentUser?.emailVerified ?? false;
};

export const sendVerificationEmail = async (): Promise<{ error: string | null }> => {
  try {
    if (!auth.currentUser) return { error: 'No user is currently signed in.' };
    const { sendEmailVerification } = await import('firebase/auth');
    await sendEmailVerification(auth.currentUser);
    return { error: null };
  } catch (error) {
    const authError = error as AuthError;
    return { error: getReadableErrorMessage(authError) };
  }
};

const getReadableErrorMessage = (error: AuthError): string => {
  switch (error.code) {
    case 'auth/user-not-found':          return 'No account found with this email address.';
    case 'auth/wrong-password':          return 'Incorrect password.';
    case 'auth/email-already-in-use':    return 'An account with this email already exists.';
    case 'auth/weak-password':           return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':           return 'Invalid email address.';
    case 'auth/user-disabled':           return 'This account has been disabled.';
    case 'auth/too-many-requests':       return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':  return 'Network error. Please check your connection.';
    case 'auth/popup-closed-by-user':    return 'Sign-in was cancelled.';
    case 'auth/cancelled-popup-request': return 'Sign-in was cancelled.';
    case 'auth/popup-blocked':           return 'Pop-up was blocked by the browser.';
    case 'auth/operation-not-allowed':   return 'This sign-in method is not enabled.';
    case 'auth/invalid-credential':      return 'Invalid credentials provided.';
    case 'auth/credential-already-in-use': return 'This credential is already linked to another account.';
    default:                             return error.message || 'An unexpected error occurred.';
  }
};