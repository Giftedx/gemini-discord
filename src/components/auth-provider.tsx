
'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, User, signInWithPopup, signOut, OAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';
import { useToast } from "@/hooks/use-toast"

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
  const { toast } = useToast();
  const isFirebaseConfigured = !!auth;

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    // Add the error observer to catch initialization errors
    const unsubscribe = onAuthStateChanged(auth!, 
      (user) => {
        setUser(user);
        setError(null); // Clear any previous errors on success
        setLoading(false);
      },
      (err) => {
        console.error("Firebase auth state error:", err);
        // Provide a more user-friendly error message
        if (err.code === 'auth/invalid-api-key' || err.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key..') {
            setError('Firebase API Key is not valid. Please check your environment configuration.');
        } else {
            setError(err.message);
        }
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [isFirebaseConfigured]);

  const loginWithDiscord = async () => {
    if (!isFirebaseConfigured) {
      toast({
        variant: 'destructive',
        title: 'Configuration Error',
        description: 'Firebase is not configured. Please check your environment variables.',
      });
      return;
    }
    setLoading(true);
    setError(null); // Clear error before attempting login
    try {
        const provider = new OAuthProvider('oidc.discord');
        // Optional: Add scopes to request additional user info
        provider.addScope('identify');
        provider.addScope('email');
        await signInWithPopup(auth!, provider);
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
    if (!isFirebaseConfigured) {
      return; // Nothing to do
    }
    setLoading(true);
    try {
        await signOut(auth!);
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
