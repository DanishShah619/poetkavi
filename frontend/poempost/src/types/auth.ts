// types/auth.ts
import { User } from 'firebase/auth';

export interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  // Optional: Add these if you implement them
  // updateProfile: (displayName?: string, photoURL?: string) => Promise<AuthResult>;
  // sendEmailVerification: () => Promise<{ error: string | null }>;
  // isEmailVerified: boolean;
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

// Additional interfaces for better type safety

export interface SignUpFormData extends AuthFormData {
  confirmPassword: string;
  displayName: string; // Make required for signup
}

export interface SignInFormData {
  email: string;
  password: string;
}

export interface ResetPasswordFormData {
  email: string;
}

export interface UpdateProfileFormData {
  displayName?: string;
  photoURL?: string;
}

// Error types for better error handling
export interface AuthError {
  code: string;
  message: string;
}

// Auth state enum for better state management
export enum AuthState {
  LOADING = 'loading',
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
  ERROR = 'error'
}

// Extended auth context with more detailed state
export interface ExtendedAuthContextType extends AuthContextType {
  authState: AuthState;
  error: string | null;
  clearError: () => void;
}

// Provider configuration
export interface AuthProviderConfig {
  redirectOnSuccess?: string;
  redirectOnError?: string;
  persistUser?: boolean;
  emailVerificationRequired?: boolean;
}

// User profile interface (extends Firebase User with additional fields)
export interface UserProfile extends Partial<User> {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  // Add custom fields as needed
  createdAt?: Date;
  lastLoginAt?: Date;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  notifications?: NotificationSettings;
}

export interface NotificationSettings {
  email?: boolean;
  push?: boolean;
  marketing?: boolean;
}

// Hook return types
export interface UseAuthReturn {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  signUp: (data: SignUpFormData) => Promise<AuthResult>;
  signIn: (data: SignInFormData) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  logOut: () => Promise<void>;
  resetPassword: (data: ResetPasswordFormData) => Promise<{ error: string | null }>;
  // Optional: Add these if you implement them
  // updateProfile?: (displayName?: string, photoURL?: string) => Promise<AuthResult>;
  // sendEmailVerification?: () => Promise<{ error: string | null }>;
  // isEmailVerified?: boolean;
}

// Form validation types
export interface FormValidation {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface AuthFormValidation {
  email?: string;
  password?: string;
  confirmPassword?: string;
  displayName?: string;
}

// API response types (if you use a backend)
export interface AuthApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// Social auth providers
export type SocialProvider = 'google' | 'facebook' | 'twitter' | 'github';

export interface SocialAuthResult extends AuthResult {
  provider?: SocialProvider;
  isNewUser?: boolean;
}

// Auth events (for analytics/logging)
export interface AuthEvent {
  type: 'sign_in' | 'sign_up' | 'sign_out' | 'password_reset' | 'error';
  timestamp: Date;
  provider?: string;
  error?: string;
  userId?: string;
}

// Protected route types
export interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireEmailVerification?: boolean;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

// Auth guard hook return type
export interface UseAuthGuardReturn {
  isAllowed: boolean;
  isLoading: boolean;
  reason?: 'not_authenticated' | 'email_not_verified' | 'loading';
}