
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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithDiscord: () => {},
  logout: () => {},
  isFirebaseConfigured: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isFirebaseConfigured = !!auth;

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth!, (user) => {
      setUser(user);
      setLoading(false);
    });
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
    try {
        const provider = new OAuthProvider('oidc.discord');
        // Optional: Add scopes to request additional user info
        provider.addScope('identify');
        provider.addScope('email');
        await signInWithPopup(auth!, provider);
    } catch (error: any) {
        console.error("Error during Discord login:", error);
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

  const value = { user, loading, loginWithDiscord, logout, isFirebaseConfigured };

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
