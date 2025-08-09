/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { getFirebaseApp } from '@/lib/firebase-client';
import { Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      // No token found, redirect to login
      router.replace('/login');
      return;
    }

    const signIn = async () => {
      try {
        const auth = getAuth(getFirebaseApp());
        await signInWithCustomToken(auth, token);
        // On successful sign-in, the AuthProvider will detect the user
        // and redirect to the dashboard, but we can be explicit.
        router.replace('/dashboard');
      } catch (err: unknown) {
        console.error('Error signing in with custom token:', err);
        setError('Failed to sign in. Please try again.');
        // Optionally, redirect back to login after a delay
        setTimeout(() => router.replace('/login'), 3000);
      }
    };

    signIn();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Verification</CardTitle>
          <CardDescription>
            {error ? 'Authentication Failed' : 'Completing sign-in...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-4">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Please wait while we sign you in.</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
