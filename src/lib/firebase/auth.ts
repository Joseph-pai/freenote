import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
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

// Initialize auth state listener
export const initAuthListener = () => {
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
    const result = await signInWithPopup(auth, provider);
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    
    if (!userDoc.exists()) {
      const newUser: AppUser = {
        uid: result.user.uid,
        email: result.user.email || '',
        nickname: result.user.displayName || 'User',
        avatarUrl: result.user.photoURL,
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
