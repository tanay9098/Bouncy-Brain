
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider,signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.apiKey,
  authDomain: process.env.authDomain,
  projectId: process.env.authDomain,
  storageBucket: process.env.authDomain,
  messagingSenderId:process.env.authDomain,
  appId:process.env.authDomain
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const popup = new signInWithPopup(auth,provider);
