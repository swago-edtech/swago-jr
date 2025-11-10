// apps/web/src/lib/firebase-client.ts
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// Client SDK config (from Firebase Console)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase App (only in browser)
function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null;
  
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApps()[0];
}

const app = getFirebaseApp();

// Export auth instance for client components
export const auth: Auth | null = app ? getAuth(app) : null;

// Utility: Validate phone format
export function isValidPhone(phone: string): boolean {
  // Must start with + and have 10-15 digits
  return /^\+[1-9]\d{9,14}$/.test(phone);
}