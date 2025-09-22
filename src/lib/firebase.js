// lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const STORAGE_BUCKET = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET; // e.g. fred-aa3c3.firebasestorage.app
const AUTH_DOMAIN = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${PROJECT_ID}.firebaseapp.com`;

if (!STORAGE_BUCKET) {
  console.error(
    "[firebase] VITE_FIREBASE_STORAGE_BUCKET is missing. Set it to the EXACT bucket shown in Firebase Storage (e.g. fred-aa3c3.firebasestorage.app)."
  );
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: AUTH_DOMAIN,
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,        // use the REAL bucket from .env
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

// Auth
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((e) => {
  console.error("[firebase] setPersistence failed:", e);
});

// Firestore
const db = getFirestore(app);

// Storage — bind to the SAME bucket (optional param; consistent with config)
const storage = getStorage(app, `gs://${STORAGE_BUCKET}`);

export { app, auth, db, storage };
