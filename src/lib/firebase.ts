import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDbANuHT5Z73-AONrz6m6BXfVuI2ag6mbk",
  authDomain: "vagas-cv-7ce39.firebaseapp.com",
  projectId: "vagas-cv-7ce39",
  storageBucket: "vagas-cv-7ce39.firebasestorage.app",
  messagingSenderId: "959081171829",
  appId: "1:959081171829:web:38395b453ef03e6e1ba13c",
  measurementId: "G-C68VR3R1GG",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;