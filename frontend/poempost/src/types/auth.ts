// types/auth.ts
// Keep only the interfaces that are imported and actively used in the codebase.
// Removed: ExtendedAuthContextType, UseAuthReturn, UseAuthGuardReturn, AuthEvent,
//          ProtectedRouteProps, AuthProviderConfig, UserProfile, UserPreferences,
//          NotificationSettings, FormValidation, AuthFormValidation, AuthApiResponse,
//          SocialProvider, SocialAuthResult, AuthState, SocialAuthResult
import { User } from 'firebase/auth';

// ── Actively used ────────────────────────────────────────────────────────────

export interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

export interface AuthResult {
  success: boolean;
  user?: User | null;
  error: string | null;
}

export interface AuthFormData {
  email: string;
  password: string;
  displayName?: string;
}

export interface SignUpFormData extends AuthFormData {
  confirmPassword: string;
  displayName: string;
}

export interface SignInFormData {
  email: string;
  password: string;
}

export interface ResetPasswordFormData {
  email: string;
}

// Generic auth error shape (kept for future error-handling utilities)
export interface AuthError {
  code: string;
  message: string;
}