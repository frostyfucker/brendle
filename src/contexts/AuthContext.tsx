import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ADMIN_EMAILS, STAFF_EMAILS } from '@/config';
import { GOOGLE_CLIENT_ID } from '@/config'; // Import GOOGLE_CLIENT_ID

// Augment the Window interface to include gapi and google
declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

interface ToastMessage {
    id: number;
    message: string;
}

interface AuthContextType {
    user: User | null;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    saveToDrive: (fileName: string, content: string, mimeType: string) => Promise<void>; // Re-add saveToDrive
    showToast: (message: string) => void;
    toast: ToastMessage | null;
    loading: boolean;
    isDriveApiReady: boolean; // Re-add isDriveApiReady
}

function determineRole(email: string): UserRole {
  if (!email) return 'staff';
  const lowerCaseEmail = email.toLowerCase();
  if (ADMIN_EMAILS.includes(lowerCaseEmail)) return 'admin';
  if (STAFF_EMAILS.includes(lowerCaseEmail)) return 'staff';
  return 'staff';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [toast, setToast] = useState<ToastMessage | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDriveApiReady, setIsDriveApiReady] = useState(false); // Re-add state
    const [googleTokenClient, setGoogleTokenClient] = useState<any>(null); // Re-add state

    useEffect(() => {
        const loadGapiScript = () => {
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.async = true;
            script.defer = true;
            script.onload = () => window.gapi.load('client', initializeGapiClient);
            document.body.appendChild(script);
        };

        // Load GSI client (for Google Sign-In, though Firebase handles auth, GSI is needed for Drive API)
        const gsiScript = document.createElement('script');
        gsiScript.src = 'https://accounts.google.com/gsi/client';
        gsiScript.async = true;
        gsiScript.defer = true;
        gsiScript.onload = () => {
            // GSI is loaded, but we don't initialize it for sign-in here anymore
            // Firebase Auth handles the sign-in flow.
            loadGapiScript(); // Load GAPI after GSI
        };
        document.body.appendChild(gsiScript);

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDoc = await getOrCreateUserProfile(firebaseUser);
                setUser(userDoc);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const initializeGapiClient = async () => {
        await window.gapi.client.init({});
        
        if (window.google?.accounts?.oauth2) {
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: 'https://www.googleapis.com/auth/drive.file',
                callback: '', // This will be set dynamically before use
            });
            setGoogleTokenClient(tokenClient);
        }
        setIsDriveApiReady(true);
    };

    const getOrCreateUserProfile = async (firebaseUser: FirebaseUser): Promise<User> => {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
            return docSnap.data() as User;
        } else {
            const role = determineRole(firebaseUser.email || '');
            const newUser: User = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'Anonymous',
                email: firebaseUser.email || '',
                role: role,
                avatarUrl: firebaseUser.photoURL || '',
            };
            await setDoc(userRef, newUser);
            return newUser;
        }
    };

    const login = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Error during sign-in:", error);
            showToast("Failed to sign in. Please try again.");
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            showToast('You have been logged out.');
        } catch (error) {
            console.error("Error during sign-out:", error);
        }
    };

    const showToast = (message: string) => {
        const id = Date.now();
        setToast({ id, message });
        setTimeout(() => setToast(current => (current?.id === id ? null : current)), 3000);
    };

    const saveToDrive = async (fileName: string, content: string, mimeType: string) => {
        if (!isDriveApiReady || !googleTokenClient) {
            showToast("Google Drive API is not ready yet. Please try again in a moment.");
            return;
        }

        googleTokenClient.callback = async (tokenResponse: any) => {
            if (tokenResponse.error) {
                console.error(tokenResponse.error);
                showToast("Google Drive access denied.");
                return;
            }

            window.gapi.client.setToken(tokenResponse);

            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";

            const metadata = { 'name': fileName, 'mimeType': mimeType };

            const multipartRequestBody =
                delimiter +
                'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: ' + mimeType + '\r\n\r\n' +
                content +
                close_delim;

            try {
                const request = await window.gapi.client.request({
                    'path': '/upload/drive/v3/files',
                    'method': 'POST',
                    'params': {'uploadType': 'multipart'},
                    'headers': { 'Content-Type': 'multipart/related; boundary="' + boundary + '"' },
                    'body': multipartRequestBody
                });

                if (request.status === 200) {
                    showToast(`File "${fileName}" saved to Google Drive!`);
                } else {
                    showToast(`Error saving to Drive: ${request.result.error.message}`);
                }
            } catch (error: any) {
                console.error(error);
                showToast(`An error occurred while saving: ${error.message}`);
            } finally {
                window.gapi.client.setToken(null);
            }
        };

        if (window.gapi.client.getToken() === null) {
            googleTokenClient.requestAccessToken({prompt: 'consent'});
        } else {
            googleTokenClient.requestAccessToken({prompt: 'none'});
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, showToast, toast, loading, saveToDrive, isDriveApiReady }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
