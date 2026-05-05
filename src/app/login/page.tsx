
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, AlertCircle, Loader2, Mail, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Email/Password states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleGoogleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      let message = err.message;
      if (err.code === 'auth/popup-blocked') {
        message = "Popup blocked! Please allow popups or use the Email tab.";
      } else if (err.code === 'auth/cancelled-popup-request') {
        message = "Login cancelled.";
      }
      setError(message);
      setIsLoggingIn(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoggingIn(true);
    setError(null);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({ 
          title: "Account Created!", 
          description: "Welcome to ShuttleScore.",
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      let message = "Check your credentials and try again.";
      if (err.code === 'auth/email-already-in-use') message = "Email already registered.";
      if (err.code === 'auth/invalid-email') message = "Invalid email address.";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') message = "Invalid email or password.";
      setError(message);
      setIsLoggingIn(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="text-center space-y-1">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <Trophy className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">ShuttleScore</CardTitle>
          <CardDescription>Badminton Performance Tracker</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Auth Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="google" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="google">Google Login</TabsTrigger>
              <TabsTrigger value="email">Email Login</TabsTrigger>
            </TabsList>
            
            <TabsContent value="google" className="pt-4">
              <Button 
                onClick={handleGoogleLogin} 
                className="w-full h-12 text-lg font-semibold" 
                disabled={isLoggingIn}
              >
                {isLoggingIn ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Sign in with Google"}
              </Button>
            </TabsContent>

            <TabsContent value="email" className="pt-4">
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="email@example.com" 
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="Min. 6 characters" 
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-11" disabled={isLoggingIn}>
                  {isLoggingIn ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    isSignUp ? "Create Account" : "Sign In"
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="link" 
                  className="w-full text-xs" 
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                  }}
                >
                  {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Create one"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
