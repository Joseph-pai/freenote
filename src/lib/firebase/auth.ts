import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { AppUser } from '../../types';
import { useAuthStore } from '../../stores/authStore';

/** Returns true when the app is running as an installed PWA (standalone mode). */
const isPWAStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
};

// Initialize auth state listener
export const initAuthListener = () => {
  // Handle the result of signInWithRedirect (PWA mode Google login).
  // Must be called once on app start so the auth state resolves after redirect.
  if (isPWAStandalone()) {
    getRedirectResult(auth).catch((error) => {
      // Ignore "no pending redirect" — it just means the user didn't come from a redirect.
      if (error?.code !== 'auth/no-current-user') {
        console.warn('getRedirectResult error:', error);
      }
    });
  }

  return onAuthStateChanged(auth, async (firebaseUser) => {
    const { setUser, setLoading } = useAuthStore.getState();
    
    if (firebaseUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (userDoc.exists()) {
          setUser(userDoc.data() as AppUser);
        } else {
          // If for some reason the doc doesn't exist but user is logged in
          const newUser: AppUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            nickname: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            avatarUrl: firebaseUser.photoURL,
            friends: [],
            language: 'zh-TW',
            theme: 'system',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          setUser(newUser);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  });
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

export const loginWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();

    if (isPWAStandalone()) {
      // PWA standalone mode: popups are blocked by Safari/Chrome on Mac/iOS.
      // Use redirect-based flow instead — onAuthStateChanged handles the result.
      await signInWithRedirect(auth, provider);
      return; // Page will reload; auth state resolved in initAuthListener
    }

    // Regular browser: use popup as before
    const result = await signInWithPopup(auth, provider);
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    
    if (!userDoc.exists()) {
      const newUser: AppUser = {
        uid: result.user.uid,
        email: result.user.email || '',
        nickname: result.user.displayName || 'User',
        avatarUrl: result.user.photoURL,
        friends: [],
        language: 'zh-TW',
        theme: 'system',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await setDoc(doc(db, 'users', result.user.uid), newUser);
    }
  } catch (error) {
    console.error("Google login error:", error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, password: string, nickname: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const newUser: AppUser = {
      uid: user.uid,
      email: user.email || '',
      nickname: nickname || user.email?.split('@')[0] || 'User',
      avatarUrl: null,
      friends: [],
      language: 'zh-TW',
      theme: 'system',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await setDoc(doc(db, 'users', user.uid), newUser);
    return user;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Reset password error:", error);
    throw error;
  }
};

export const updateUserProfile = async (uid: string, updates: Partial<AppUser>) => {
  try {
    await setDoc(doc(db, 'users', uid), { ...updates, updatedAt: Date.now() }, { merge: true });
    // Update local state
    const { user, setUser } = useAuthStore.getState();
    if (user && user.uid === uid) {
      setUser({ ...user, ...updates, updatedAt: Date.now() });
    }
  } catch (error) {
    console.error("Update profile error:", error);
    throw error;
  }
};
