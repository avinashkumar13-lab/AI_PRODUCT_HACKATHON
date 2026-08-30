import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App instance safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const firebaseAuth = getAuth(app);

// Provider with all requested Gmail scopes
export const googleAuthProvider = new GoogleAuthProvider();

export const GMAIL_SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.insert',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/gmail.settings.sharing',
  'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
  'https://www.googleapis.com/auth/gmail.addons.current.message.action',
  'https://www.googleapis.com/auth/gmail.addons.current.message.metadata',
  'https://www.googleapis.com/auth/gmail.addons.current.message.readonly'
];

GMAIL_SCOPES.forEach((scope) => {
  googleAuthProvider.addScope(scope);
});

// Always prompt for account selection / incremental consent if needed
googleAuthProvider.setCustomParameters({
  prompt: 'consent select_account'
});

// Flag to track sign-in in progress
let isSigningIn = false;

// In-memory token cache (NEVER saved to localStorage or sessionStorage per security requirements)
let cachedAccessToken: string | null = null;
let cachedGoogleUser: User | null = null;

/**
 * Initialize Google Auth State Listener
 */
export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(firebaseAuth, async (user: User | null) => {
    if (user) {
      cachedGoogleUser = user;
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // User is logged into Firebase Auth, but we need fresh OAuth access token
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedGoogleUser = null;
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Trigger popup-based Google Sign-In with Gmail permissions
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(firebaseAuth, googleAuthProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Could not retrieve Google OAuth access token.');
    }

    cachedAccessToken = credential.accessToken;
    cachedGoogleUser = result.user;

    return {
      user: result.user,
      accessToken: cachedAccessToken
    };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get current in-memory access token
 */
export const getGoogleAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Get currently logged in Google user
 */
export const getGoogleUser = (): User | null => {
  return cachedGoogleUser || firebaseAuth.currentUser;
};

/**
 * Check if access token is available in memory
 */
export const isGoogleAuthenticated = (): boolean => {
  return Boolean(cachedAccessToken);
};

/**
 * Sign out of Google / Firebase Auth and clear cached memory token
 */
export const googleLogout = async (): Promise<void> => {
  try {
    await signOut(firebaseAuth);
  } finally {
    cachedAccessToken = null;
    cachedGoogleUser = null;
  }
};
