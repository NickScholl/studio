
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
import { Card, CardContent } from '@/components/ui/card';
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
        message = "Login popup closed. Ensure popups are allowed in your browser.";
      } else if (err.code === 'auth/popup-blocked') {
        message = "Popup blocked! Please allow popups for this site.";
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
          title: "Welcome to the Court!", 
          description: "Your account is ready for action.",
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      let message = "Invalid credentials. Try again.";
      if (err.code === 'auth/email-already-in-use') message = "Email already registered.";
      if (err.code === 'auth/invalid-email') message = "Invalid email address.";
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
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/20 p-6">
      <div className="w-full max-w-[480px] space-y-12 animate-in fade-in zoom-in duration-700">
        <div className="text-center space-y-6">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-primary shadow-2xl shadow-primary/40 transition-transform hover:scale-105 active:scale-95 duration-300">
            <Trophy className="h-12 w-12 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-6xl font-black tracking-tighter text-foreground drop-shadow-sm">ShuttleScore</h1>
            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.4em] opacity-80">Elite Badminton Analytics</p>
          </div>
        </div>

        <Card className="shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] border-none overflow-hidden bg-white/95 backdrop-blur-xl rounded-[2.5rem]">
          <Tabs defaultValue="login" className="w-full" onValueChange={(v) => {
            setIsSignUp(v === 'signup');
            setError(null);
          }}>
            <TabsList className="grid w-full grid-cols-2 rounded-none h-20 bg-muted/5 p-0 border-b border-muted/20">
              <TabsTrigger value="login" className="h-full rounded-none data-[state=active]:bg-white data-[state=active]:shadow-none font-black text-xs uppercase tracking-widest transition-all">SIGN IN</TabsTrigger>
              <TabsTrigger value="signup" className="h-full rounded-none data-[state=active]:bg-white data-[state=active]:shadow-none font-black text-xs uppercase tracking-widest transition-all">SIGN UP</TabsTrigger>
            </TabsList>
            
            <CardContent className="pt-12 px-10 pb-14 space-y-10">
              {error && (
                <Alert variant="destructive" className="animate-in slide-in-from-top-4 border-none shadow-xl bg-destructive/5 rounded-2xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="font-black text-xs uppercase tracking-widest">Auth Error</AlertTitle>
                  <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleGoogleLogin} 
                variant="outline"
                className="w-full h-16 text-sm font-black uppercase tracking-widest gap-4 border-2 border-muted/20 hover:bg-muted/30 transition-all shadow-xl shadow-black/5 rounded-2xl group active:scale-[0.98]" 
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
                  <span className="w-full border-t border-muted-foreground/10" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-white px-8 text-muted-foreground font-black tracking-[0.3em]">SECURE ACCESS</span>
                </div>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-1">Email Identity</Label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="player@pro.com" 
                      className="pl-14 h-16 bg-muted/5 border-2 border-muted/10 focus-visible:ring-primary shadow-inner rounded-2xl text-base font-bold"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-1">Access Key</Label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      className="pl-14 h-16 bg-muted/5 border-2 border-muted/10 focus-visible:ring-primary shadow-inner rounded-2xl text-base font-bold"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-16 font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/30 rounded-2xl transition-all hover:translate-y-[-2px] active:translate-y-[1px] group" disabled={isLoggingIn}>
                  {isLoggingIn ? (
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      {isSignUp ? "Register Account" : "Enter Dashboard"}
                      <Trophy className="ml-3 h-5 w-5 transition-transform group-hover:rotate-12" />
                    </>
                  )}
                </Button>
              </form>
              
              <p className="text-[10px] text-center text-muted-foreground leading-relaxed px-8 font-black uppercase tracking-tighter opacity-60">
                By entering, you agree to track elite performance stats on ShuttleScore.
              </p>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
