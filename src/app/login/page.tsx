
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      let message = err.message;
      if (err.code === 'auth/popup-closed-by-user') {
        message = "Popup closed. Please try again and keep the window open.";
      } else if (err.code === 'auth/popup-blocked') {
        message = "Popup blocked! Please allow popups in your browser settings.";
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
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-[480px] space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary shadow-[0_10px_40px_-10px_rgba(var(--primary),0.5)] transition-transform hover:scale-105">
            <Trophy className="h-12 w-12 text-primary-foreground" />
          </div>
          <div className="space-y-1">
            <h1 className="text-5xl font-black tracking-tighter text-foreground">ShuttleScore</h1>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.3em]">Advanced Performance Hub</p>
          </div>
        </div>

        <Card className="shadow-[0_30px_60px_-12px_rgba(0,0,0,0.25)] border-none overflow-hidden bg-white/95 backdrop-blur-sm">
          <Tabs defaultValue="login" className="w-full" onValueChange={(v) => {
            setIsSignUp(v === 'signup');
            setError(null);
          }}>
            <TabsList className="grid w-full grid-cols-2 rounded-none h-16 bg-muted/10 p-0 border-b">
              <TabsTrigger value="login" className="h-full rounded-none data-[state=active]:bg-white data-[state=active]:shadow-none font-bold text-sm border-r transition-all">SIGN IN</TabsTrigger>
              <TabsTrigger value="signup" className="h-full rounded-none data-[state=active]:bg-white data-[state=active]:shadow-none font-bold text-sm transition-all">CREATE ACCOUNT</TabsTrigger>
            </TabsList>
            
            <CardContent className="pt-10 px-10 pb-12 space-y-8">
              {error && (
                <Alert variant="destructive" className="animate-in slide-in-from-top-4 border-2 shadow-lg">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="font-bold">Access Denied</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleGoogleLogin} 
                variant="outline"
                className="w-full h-14 text-sm font-bold gap-4 border-2 hover:bg-muted/30 transition-all shadow-md group active:scale-[0.98]" 
                disabled={isLoggingIn}
              >
                {isLoggingIn ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <>
                    <svg className="h-6 w-6 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-muted-foreground/20" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-white px-6 text-muted-foreground font-black tracking-widest">Secure Email Login</span>
                </div>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="Enter your email" 
                      className="pl-12 h-14 bg-muted/5 border-2 focus-visible:ring-primary shadow-sm transition-all text-sm font-medium"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      className="pl-12 h-14 bg-muted/5 border-2 focus-visible:ring-primary shadow-sm transition-all text-sm font-medium"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-14 font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/30 transition-all hover:translate-y-[-2px] active:translate-y-[1px]" disabled={isLoggingIn}>
                  {isLoggingIn ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    isSignUp ? "Create Account" : "Access Dashboard"
                  )}
                </Button>
              </form>
              
              <p className="text-[10px] text-center text-muted-foreground leading-relaxed px-6 font-medium">
                By entering, you agree to track your badminton performance and manage your stats on ShuttleScore.
              </p>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
