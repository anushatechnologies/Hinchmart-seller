import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyBa1Arilraettuqi_8IA0v4Qae0mwrkYjQ',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'anushabazaar-2288e.firebaseapp.com',
  databaseURL: env.VITE_FIREBASE_DATABASE_URL || 'https://anushabazaar-2288e-default-rtdb.firebaseio.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'anushabazaar-2288e',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'anushabazaar-2288e.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '64875938387',
  appId: env.VITE_FIREBASE_APP_ID || '1:64875938387:web:0ae8c08c931e2dabba7ca6',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || 'G-HP45RKD0BT',
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
};
