// Firebase configuration for the frontend
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, collection, doc, addDoc, updateDoc, getDocs, getDoc, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyADIcZUvWuneF_5pGEtYElAuhknprCVQKM",
    authDomain: "carrerbots.firebaseapp.com",
    projectId: "carrerbots",
    storageBucket: "carrerbots.firebasestorage.app",
    messagingSenderId: "13207478532",
    appId: "1:13207478532:web:bebda4bbac2d8763be7051",
    measurementId: "G-3Z0SGYXGQZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Analytics (only in browser)
let analytics = null;
if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
}

// Sign in with Google
export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Get the ID token to send to backend
        const idToken = await user.getIdToken();

        // Verify with backend
        const response = await fetch('/api/auth/verify-token', {
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

// Sign out
export const signOutUser = async () => {
    try {
        await signOut(auth);
        return true;
    } catch (error) {
        console.error('Sign out error:', error);
        throw error;
    }
};

// Sign up with email and password
export const signUpWithEmail = async (email, password, displayName) => {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
            await updateProfile(result.user, { displayName });
        }
        return {
            user: {
                uid: result.user.uid,
                email: result.user.email,
                displayName: displayName || result.user.email,
                photoURL: result.user.photoURL
            }
        };
    } catch (error) {
        console.error('Sign up error:', error);
        throw error;
    }
};

// Sign in with email and password
export const signInWithEmail = async (email, password) => {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return {
            user: {
                uid: result.user.uid,
                email: result.user.email,
                displayName: result.user.displayName,
                photoURL: result.user.photoURL
            }
        };
    } catch (error) {
        console.error('Sign in error:', error);
        throw error;
    }
};

// Get current user's ID token (for API calls)
export const getIdToken = async () => {
    const user = auth.currentUser;
    if (user) {
        return await user.getIdToken();
    }
    return null;
};

// Auth state observer
export const onAuthChange = (callback) => {
    return onAuthStateChanged(auth, callback);
};

// ============ SESSION MANAGEMENT ============

// Create a new session
export const createSession = async (userId, firstMessage) => {
    try {
        const sessionRef = await addDoc(collection(db, 'sessions'), {
            userId,
            title: firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : ''),
            messages: [{
                content: firstMessage,
                isUser: true,
                timestamp: new Date().toISOString()
            }],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return sessionRef.id;
    } catch (error) {
        console.error('Error creating session:', error);
        throw error;
    }
};

// Add message to session
export const addMessageToSession = async (sessionId, message) => {
    try {
        const sessionRef = doc(db, 'sessions', sessionId);
        const sessionDoc = await getDoc(sessionRef);

        if (sessionDoc.exists()) {
            const currentMessages = sessionDoc.data().messages || [];
            await updateDoc(sessionRef, {
                messages: [...currentMessages, {
                    content: message.content,
                    isUser: message.isUser,
                    timestamp: new Date().toISOString()
                }],
                updatedAt: serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Error adding message to session:', error);
        throw error;
    }
};

// Get user's sessions
export const getUserSessions = async (userId) => {
    try {
        const sessionsQuery = query(
            collection(db, 'sessions'),
            where('userId', '==', userId),
            orderBy('updatedAt', 'desc')
        );
        const snapshot = await getDocs(sessionsQuery);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching sessions:', error);
        return [];
    }
};

// Get session by ID
export const getSession = async (sessionId) => {
    try {
        const sessionDoc = await getDoc(doc(db, 'sessions', sessionId));
        if (sessionDoc.exists()) {
            return { id: sessionDoc.id, ...sessionDoc.data() };
        }
        return null;
    } catch (error) {
        console.error('Error fetching session:', error);
        return null;
    }
};

// Export instances
export { app, auth, db, analytics };

