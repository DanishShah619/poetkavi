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
  setPersistence,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { AuthResult } from '@/types/auth';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
googleProvider.addScope('email');
googleProvider.addScope('profile');

const GOOGLE_REDIRECT_PENDING_KEY = 'poempost:googleRedirectPending';
const POST_AUTH_REDIRECT_KEY = 'poempost:postAuthRedirect';
const REDIRECT_RESULT_TIMEOUT_MS = 6000;

const getSafeRedirectPath = (path?: string | null): string => {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return '/dashboard';
  return path;
};

const writeRedirectIntent = (redirectTo?: string) => {
  if (typeof window === 'undefined') return;

  const safePath = getSafeRedirectPath(redirectTo);
  sessionStorage.setItem(GOOGLE_REDIRECT_PENDING_KEY, 'true');
  sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, safePath);
  localStorage.setItem(GOOGLE_REDIRECT_PENDING_KEY, 'true');
  localStorage.setItem(POST_AUTH_REDIRECT_KEY, safePath);
};

const readRedirectIntent = (): string => {
  if (typeof window === 'undefined') return '/dashboard';
  return getSafeRedirectPath(
    sessionStorage.getItem(POST_AUTH_REDIRECT_KEY) ||
      localStorage.getItem(POST_AUTH_REDIRECT_KEY)
  );
};

const clearRedirectIntent = () => {
  if (typeof window === 'undefined') return;

  sessionStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
  sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
  localStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
  localStorage.removeItem(POST_AUTH_REDIRECT_KEY);
};

export const hasPendingGoogleRedirect = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    sessionStorage.getItem(GOOGLE_REDIRECT_PENDING_KEY) === 'true' ||
    localStorage.getItem(GOOGLE_REDIRECT_PENDING_KEY) === 'true'
  );
};

const isWebView = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  return (
    /(wv|WebView)/i.test(ua) ||
    (ua.includes('Android') && ua.includes('Version/') && !ua.includes('Chrome'))
  );
};

const waitForRedirectUser = (): Promise<User | null> =>
  new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }

    const timeout = window.setTimeout(() => {
      unsubscribe();
      resolve(auth.currentUser);
    }, REDIRECT_RESULT_TIMEOUT_MS);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      window.clearTimeout(timeout);
      unsubscribe();
      resolve(user);
    });
  });

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

export const signInWithGoogle = async (redirectTo?: string): Promise<AuthResult> => {
  try {
    await setPersistence(auth, browserLocalPersistence);

    if (isWebView()) {
      writeRedirectIntent(redirectTo);
      await signInWithRedirect(auth, googleProvider);
      return { success: true, user: null, error: null };
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      return { success: true, user: result.user, error: null };
    } catch (popupError) {
      const authError = popupError as AuthError;
      if (
        authError.code !== 'auth/popup-blocked' &&
        authError.code !== 'auth/popup-closed-by-user' &&
        authError.code !== 'auth/cancelled-popup-request' &&
        authError.code !== 'auth/operation-not-supported-in-this-environment'
      ) {
        throw popupError;
      }

      writeRedirectIntent(redirectTo);
      await signInWithRedirect(auth, googleProvider);
      return { success: true, user: null, error: null };
    }
  } catch (error) {
    const authError = error as AuthError;
    console.error('Google sign in error:', authError.code, authError.message);
    return { success: false, user: null, error: getReadableErrorMessage(authError) };
  }
};

export const handleGoogleRedirectResult = async (): Promise<AuthResult | null> => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const hadPendingRedirect = hasPendingGoogleRedirect();

    const result = await getRedirectResult(auth);
    if (result?.user) {
      const redirectTo = readRedirectIntent();
      clearRedirectIntent();
      return { success: true, user: result.user, error: null, redirectTo };
    }

    if (hadPendingRedirect) {
      const user = await waitForRedirectUser();
      if (user) {
        const redirectTo = readRedirectIntent();
        clearRedirectIntent();
        return { success: true, user, error: null, redirectTo };
      }
    }

    return null;
  } catch (error) {
    const authError = error as AuthError;
    console.error('Redirect result error:', authError.code, authError.message);
    clearRedirectIntent();
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
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
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
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for Google sign-in in Firebase.';
    case 'auth/auth-domain-config-required':
      return 'Firebase auth domain configuration is missing.';
    case 'auth/invalid-credential':
      return 'Invalid credentials provided.';
    case 'auth/credential-already-in-use':
      return 'This credential is already linked to another account.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
};
