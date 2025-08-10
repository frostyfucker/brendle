import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyC60L5Ae6Rx7nE1QDN8KaM-r7nyHJ3Myis",
    authDomain: "brendle.firebaseapp.com",
    projectId: "brendle",
    storageBucket: "brendle.appspot.com",
    messagingSenderId: "267634766783",
    appId: "1:267634766783:web:c7d0276c81b0437d37270a",
    measurementId: "G-4HR3CX1GZD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider, storage };
