/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, User, Unsubscribe, getAuth, Auth, signOut } from 'firebase/auth';
import { getFirebaseApp, isFirebaseConfigured } from '@/lib/firebase-client';
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  isFirebaseConfigured: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
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
    } catch (err: unknown) {
        console.error("Firebase auth setup error:", err);
        setError(err instanceof Error ? err.message : 'Firebase auth setup failed');
        setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const logout = async () => {
    if (!auth) return;
    setLoading(true);
    try {
        await signOut(auth);
        setUser(null); // Explicitly clear the user state
    } catch (error: unknown) {
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

  const value = { user, loading, logout, isFirebaseConfigured, error };

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
