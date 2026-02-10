// Firestore database utility functions
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { app } from './firebase';

// Initialize Firestore
const db = getFirestore(app);

// User operations
export const createUserProfile = async (userId, userData) => {
    try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
            ...userData,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error creating user profile:', error);
        throw error;
    }
};

export const getUserProfile = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return userSnap.data();
        }
        return null;
    } catch (error) {
        console.error('Error getting user profile:', error);
        throw error;
    }
};

export const updateUserProfile = async (userId, updates) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            ...updates,
            lastLogin: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
};

// Session operations
export const createSession = async (userId, sessionData = {}) => {
    try {
        const sessionsRef = collection(db, 'users', userId, 'sessions');
        const sessionDoc = await addDoc(sessionsRef, {
            userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            stage: 'discovery',
            status: 'active',
            title: sessionData.title || 'New Career Counseling Session',
            messageCount: 0,
            ...sessionData
        });
        return sessionDoc.id;
    } catch (error) {
        console.error('Error creating session:', error);
        throw error;
    }
};

export const getSession = async (userId, sessionId) => {
    try {
        const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
        const sessionSnap = await getDoc(sessionRef);

        if (sessionSnap.exists()) {
            return { id: sessionSnap.id, ...sessionSnap.data() };
        }
        return null;
    } catch (error) {
        console.error('Error getting session:', error);
        throw error;
    }
};

export const getUserSessions = async (userId) => {
    try {
        const sessionsRef = collection(db, 'users', userId, 'sessions');
        const q = query(sessionsRef, orderBy('updatedAt', 'desc'));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting user sessions:', error);
        throw error;
    }
};

export const updateSession = async (userId, sessionId, updates) => {
    try {
        const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
        await updateDoc(sessionRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error updating session:', error);
        throw error;
    }
};

// Message operations
export const saveMessage = async (userId, sessionId, messageData) => {
    try {
        const messagesRef = collection(db, 'users', userId, 'sessions', sessionId, 'messages');
        const messageDoc = await addDoc(messagesRef, {
            sessionId,
            userId,
            timestamp: serverTimestamp(),
            ...messageData
        });

        // Update session message count and updatedAt
        const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
        const sessionSnap = await getDoc(sessionRef);
        if (sessionSnap.exists()) {
            const currentCount = sessionSnap.data().messageCount || 0;
            await updateDoc(sessionRef, {
                messageCount: currentCount + 1,
                updatedAt: serverTimestamp()
            });
        }

        return messageDoc.id;
    } catch (error) {
        console.error('Error saving message:', error);
        throw error;
    }
};

export const getSessionMessages = async (userId, sessionId) => {
    try {
        const messagesRef = collection(db, 'users', userId, 'sessions', sessionId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting session messages:', error);
        throw error;
    }
};

// Preferences operations
export const saveUserPreferences = async (userId, preferences) => {
    try {
        const prefRef = doc(db, 'users', userId, 'preferences', 'settings');
        await setDoc(prefRef, {
            ...preferences,
            updatedAt: serverTimestamp()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error saving preferences:', error);
        throw error;
    }
};

export const getUserPreferences = async (userId) => {
    try {
        const prefRef = doc(db, 'users', userId, 'preferences', 'settings');
        const prefSnap = await getDoc(prefRef);

        if (prefSnap.exists()) {
            return prefSnap.data();
        }
        return null;
    } catch (error) {
        console.error('Error getting preferences:', error);
        throw error;
    }
};

export { db };
