
'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, User, signInWithPopup, signOut, OAuthProvider, Unsubscribe, getAuth, Auth } from 'firebase/auth';
import { getFirebaseApp, isFirebaseConfigured } from '@/lib/firebase-client';
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithDiscord: () => void;
  logout: () => void;
  isFirebaseConfigured: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithDiscord: () => {},
  logout: () => {},
  isFirebaseConfigured: false,
  error: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setError('Firebase client configuration is missing. Please set the required `NEXT_PUBLIC_FIREBASE_*` environment variables.');
      setLoading(false);
      return;
    }

    let unsubscribe: Unsubscribe | undefined;
    try {
      const app = getFirebaseApp();
      const authInstance = getAuth(app);
      setAuth(authInstance);

      unsubscribe = onAuthStateChanged(authInstance,
        (user) => {
          setUser(user);
          setError(null);
          setLoading(false);
        },
        (err) => {
          console.error("Firebase auth state error:", err);
          setError(err.message);
          setLoading(false);
        }
      );
    } catch (err: any) {
        console.error("Firebase auth setup error:", err);
        if (err.code && (err.code === 'auth/invalid-api-key' || err.code.includes('api-key-not-valid'))) {
            setError('Firebase API Key is not valid. Please check your environment configuration.');
        } else {
            setError(err.message);
        }
        setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const loginWithDiscord = async () => {
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'Firebase Auth is not initialized.',
      });
      return;
    }
    setLoading(true);
    setError(null);
    try {
        const provider = new OAuthProvider('oidc.discord');
        provider.addScope('identify');
        provider.addScope('email');
        await signInWithPopup(auth, provider);
    } catch (error: any) {
        console.error("Error during Discord login:", error);
        setError(error.message);
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: error.message || "An unexpected error occurred during login.",
        });
    } finally {
        setLoading(false);
    }
  };

  const logout = async () => {
    if (!auth) return;
    setLoading(true);
    try {
        await signOut(auth);
    } catch (error: any) {
        console.error("Error signing out:", error);
        toast({
            variant: "destructive",
            title: "Logout Failed",
            description: "An unexpected error occurred during logout.",
        });
    } finally {
        setLoading(false);
    }
  };

  const value = { user, loading, loginWithDiscord, logout, isFirebaseConfigured, error };

  return (
    <AuthContext.Provider value={value}>
      {children}
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
