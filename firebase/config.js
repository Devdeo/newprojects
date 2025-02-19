import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBrawI1i3b1Vdd-y-PzQ5b0xn18jBR7GLI",
  authDomain: "livestream-a7044.firebaseapp.com",
  projectId: "livestream-a7044",
  storageBucket: "livestream-a7044.firebasestorage.app",
  messagingSenderId: "19034577438",
  appId: "1:19034577438:web:2a5ca4e7dd56947c492c0f",
  measurementId: "G-GVVM73N4EJ",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
