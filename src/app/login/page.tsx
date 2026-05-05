
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LoginPage() {
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (!userLoading && user) {
      router.push('/');
    }
  }, [user, userLoading, router]);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    
    setIsLoggingIn(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    
    try {
      await signInWithPopup(auth, provider);
      // Redirect happens in useEffect
    } catch (err: any) {
      console.error('Login failed', err);
      let message = "An unexpected error occurred.";
      
      if (err.code === 'auth/popup-blocked') {
        message = "The sign-in popup was blocked by your browser. Please allow popups for this site.";
      } else if (err.code === 'auth/unauthorized-domain') {
        message = "This domain is not authorized in the Firebase Console (Authentication > Settings > Authorized Domains).";
      } else if (err.code === 'auth/network-request-failed') {
        message = "Network error. Please check your internet connection.";
      } else if (err.code === 'auth/configuration-not-found') {
        message = "Google Sign-in is not configured properly in your Firebase project.";
      }

      setError(message);
      toast({
        variant: 'destructive',
        title: 'Login Error',
        description: message,
      });
      setIsLoggingIn(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg border-none">
        <CardHeader className="text-center space-y-1">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-inner">
            <Trophy className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">ShuttleScore</CardTitle>
          <CardDescription className="text-base">
            Your ultimate badminton performance companion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {error && (
            <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Sign-in Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Button 
            onClick={handleLogin} 
            className="w-full h-12 text-lg font-semibold shadow-md transition-all active:scale-[0.98]" 
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in with Google"
            )}
          </Button>
          
          <div className="space-y-3 pt-2">
            <p className="text-center text-xs text-muted-foreground leading-relaxed">
              Sign in to sync your match history across all your devices.
            </p>
            <div className="rounded-lg bg-muted/50 p-3 text-[10px] text-muted-foreground/80 leading-normal border border-border/50">
              <p className="font-bold mb-1 uppercase tracking-wider">Troubleshooting:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Ensure popups are allowed in your browser.</li>
                <li>Verify your domain is in the <strong>'Authorized Domains'</strong> list in Firebase Console.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
