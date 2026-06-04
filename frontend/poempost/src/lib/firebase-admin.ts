import * as admin from "firebase-admin";

let isInitialized = false;

function initFirebase() {
  if (isInitialized) return;

  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error(
      "FIREBASE_PRIVATE_KEY is not defined. Please check your environment variables."
    );
  }

  // Robust PEM key format cleaning:
  // 1. Remove quotes
  // 2. Convert literal "\\n" sequences to actual newlines
  // 3. Remove carriage returns
  // 4. Collapse duplicate newlines to ensure single-newline formatting
  const cleanedPrivateKey = privateKey
    .replace(/"/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\r/g, "")
    .replace(/\n+/g, "\n");

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: cleanedPrivateKey,
    }),
  });

  isInitialized = true;
}

// Lazy initialization proxies:
// Prevents Firebase Admin initialization from executing at module load time (build phase)
export const adminAuth = new Proxy({} as admin.auth.Auth, {
  get(target, prop) {
    initFirebase();
    const auth = admin.auth();
    const value = Reflect.get(auth, prop);
    return typeof value === "function" ? value.bind(auth) : value;
  },
});

export const adminDb = new Proxy({} as admin.firestore.Firestore, {
  get(target, prop) {
    initFirebase();
    const db = admin.firestore();
    const value = Reflect.get(db, prop);
    return typeof value === "function" ? value.bind(db) : value;
  },
});

