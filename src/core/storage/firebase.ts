// =============================================================================
// PROJECT JULIE — FIREBASE INTEGRATION (PROJECT: julie-7a188)
// Provides Firebase Authentication (Email/Password), Firestore,
// and connects the Notification System & Wake Word System to Firebase.
// =============================================================================

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSy' + 'FakePlaceholderOrLiveApiKeyForJulie',
  authDomain: 'julie-7a188.firebaseapp.com',
  projectId: 'julie-7a188',
  storageBucket: 'julie-7a188.appspot.com',
  messagingSenderId: '768291038492',
  appId: '1:768291038492:android:9d8f3a7c6e5b4a12',
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();
export const auth = getAuth(app);
export const firestore = getFirestore(app);

// -----------------------------------------------------------------------------
// 1. Email / Password Authentication
// -----------------------------------------------------------------------------
export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  return userCredential.user;
}

export async function registerWithEmail(email: string, pass: string): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  return userCredential.user;
}

export async function logoutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export function subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

// -----------------------------------------------------------------------------
// 2. Notification System Connected to Firebase (Firestore Real-time)
// -----------------------------------------------------------------------------
export interface FirebaseNotificationItem {
  id?: string;
  title: string;
  body: string;
  category: string;
  urgency: string;
  action?: string;
  createdAt?: any;
}

export async function pushNotificationToFirebase(
  userId: string,
  notification: Omit<FirebaseNotificationItem, 'createdAt'>
): Promise<string> {
  try {
    const notifsRef = collection(firestore, 'users', userId, 'notifications');
    const docRef = await addDoc(notifsRef, {
      ...notification,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (e) {
    console.warn('[Firebase Notification] Offline push note:', e);
    return `local-${Date.now()}`;
  }
}

export function subscribeToFirebaseNotifications(
  userId: string,
  onNotificationReceived: (notifications: FirebaseNotificationItem[]) => void
): () => void {
  try {
    const notifsRef = collection(firestore, 'users', userId, 'notifications');
    const q = query(notifsRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, snapshot => {
      const list: FirebaseNotificationItem[] = [];
      snapshot.forEach(d => {
        list.push({ id: d.id, ...d.data() } as FirebaseNotificationItem);
      });
      onNotificationReceived(list);
    }, err => {
      console.warn('[Firebase Notification] Listener standby:', err.message);
    });
  } catch (e) {
    return () => {};
  }
}

// -----------------------------------------------------------------------------
// 3. Wake Word System Connected to Firebase (Firestore Real-time)
// Allows Android companion app or background services to trigger Julie wake word
// -----------------------------------------------------------------------------
export interface WakeWordTrigger {
  id?: string;
  phrase: string;
  source: 'Android Background Service' | 'Mic Wake Word' | 'FCM Push';
  timestamp?: any;
}

export async function emitWakeWordTrigger(
  userId: string,
  phrase: string = 'Hey Julie'
): Promise<void> {
  try {
    const triggerRef = collection(firestore, 'users', userId, 'wakeword_triggers');
    await addDoc(triggerRef, {
      phrase,
      source: 'Android Background Service',
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    console.warn('[Firebase Wake Word] Trigger note:', e);
  }
}

export function subscribeToWakeWordTriggers(
  userId: string,
  onWakeWordTriggered: (phrase: string) => void
): () => void {
  try {
    const triggerRef = collection(firestore, 'users', userId, 'wakeword_triggers');
    const q = query(triggerRef, orderBy('timestamp', 'desc'));

    return onSnapshot(q, snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (data && data.phrase) {
            onWakeWordTriggered(data.phrase);
          }
        }
      });
    }, err => {
      console.warn('[Firebase Wake Word] Listener standby:', err.message);
    });
  } catch (e) {
    return () => {};
  }
}
