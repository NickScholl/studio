
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LoginPage() {
  const { user, loading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleLogin = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('Login failed', err);
      let message = "An unexpected error occurred.";
      
      if (err.code === 'auth/popup-blocked') {
        message = "The sign-in popup was blocked by your browser. Please allow popups for this site.";
      } else if (err.code === 'auth/unauthorized-domain') {
        message = "This domain (e.g., localhost or your hosting URL) is not authorized in the Firebase Console.";
      } else if (err.code === 'auth/network-request-failed') {
        message = "Network error. Please check your internet connection.";
      } else if (err.code === 'auth/configuration-not-found') {
        message = "Google Sign-in is not enabled in your Firebase project. Please enable it in the console.";
      }

      setError(message);
      toast({
        variant: 'destructive',
        title: 'Login Error',
        description: message,
      });
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Trophy className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">ShuttleScore</CardTitle>
          <CardDescription>
            Your ultimate badminton performance companion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Button onClick={handleLogin} className="w-full" size="lg">
            Sign in with Google
          </Button>
          
          <div className="space-y-2 pt-4">
            <p className="text-center text-xs text-muted-foreground">
              Sign in to sync your match history across all your devices.
            </p>
            <p className="text-center text-[10px] text-muted-foreground/60">
              Note: Ensure popups are enabled and your domain is added to 'Authorized Domains' in Firebase Authentication settings.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
