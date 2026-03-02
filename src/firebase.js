// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAcTz_t6In9YEh5sHBjaTVcIYQLIreAiV4",
  authDomain: "iconx-1a576.firebaseapp.com",
  projectId: "iconx-1a576",
  storageBucket: "iconx-1a576.firebasestorage.app",
  messagingSenderId: "227631904472",
  appId: "1:227631904472:web:f07ddac207ce0bd95909ad",
  measurementId: "G-1F309VW6Z0"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Safe analytics initialization
export const analyticsPromise = isSupported().then(yes => yes ? getAnalytics(app) : null);