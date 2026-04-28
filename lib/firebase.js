import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, deleteUser } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const firebaseConfig = {
    apiKey: "AIzaSyADIcZUvWuneF_5pGEtYElAuhknprCVQKM",
    authDomain: "carrerbots.firebaseapp.com",
    projectId: "carrerbots",
    storageBucket: "carrerbots.firebasestorage.app",
    messagingSenderId: "13207478532",
    appId: "1:13207478532:web:bebda4bbac2d8763be7051",
    measurementId: "G-3Z0SGYXGQZ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

let analytics = null;
if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
}

export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        const idToken = await user.getIdToken();

        const response = await fetch(`${API_BASE_URL}/api/auth/verify-token`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Backend verification failed');
        }

        return {
            user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL
            },
            idToken
        };
    } catch (error) {
        console.error('Sign in error:', error);
        throw error;
    }
};

export const signOutUser = async () => {
    try {
        await signOut(auth);
        return true;
    } catch (error) {
        console.error('Sign out error:', error);
        throw error;
    }
};

export const deleteCurrentUser = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('No user is signed in');
    await deleteUser(user);
    return true;
};

export const getIdToken = async () => {
    const user = auth.currentUser;
    if (user) {
        return await user.getIdToken();
    }
    return null;
};

export const onAuthChange = (callback) => {
    return onAuthStateChanged(auth, callback);
};

export { auth, analytics };
