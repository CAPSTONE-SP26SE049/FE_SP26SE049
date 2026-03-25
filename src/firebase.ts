import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: "speak-journey-vn-2026",
  appId: "1:993786159688:web:3073aac29383e7e6f1ae7d",
  storageBucket: "speak-journey-vn-2026.firebasestorage.app",
  apiKey: "AIzaSyAWmVskBS2WrntIzFrA7lytyjGnlwC6-iQ",
  authDomain: "speak-journey-vn-2026.firebaseapp.com",
  messagingSenderId: "993786159688",
  measurementId: "G-ZSGVBEVNR1"
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export default app;
