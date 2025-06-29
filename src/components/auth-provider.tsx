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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithDiscord: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithDiscord = async () => {
    setLoading(true);
    try {
        const provider = new OAuthProvider('oidc.discord');
        // Optional: Add scopes to request additional user info
        provider.addScope('identify');
        provider.addScope('email');
        await signInWithPopup(auth, provider);
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

  const value = { user, loading, loginWithDiscord, logout };

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
