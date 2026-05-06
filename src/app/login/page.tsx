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
    if (isLoggingIn || !auth) return;
    setIsLoggingIn(true);
    setError(null);
    
    try {
      const provider = new GoogleAuthProvider();
      // select_account helps prevent silent failures and keeps the popup active
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      let message = err.message;
      if (err.code === 'auth/popup-closed-by-user') {
        message = "Sign-in was interrupted. Please ensure popups are allowed and keep the window open.";
      }
      setError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn || !auth) return;
    
    if (password.length < 6) {
      setError("Security keys must be at least 6 characters.");
      return;
    }

    setIsLoggingIn(true);
    setError(null);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({ title: "Profile Initialized", description: "Welcome to the elite roster." });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError("Authorization failed. Verify credentials.");
    } finally {
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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f0f2f5] p-6">
      <div className="w-full max-w-[440px] flex flex-col items-center gap-10 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary shadow-2xl shadow-primary/40 transform hover:scale-110 transition-transform">
            <Trophy className="h-10 w-10 text-primary-foreground" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">ShuttleScore</h1>
            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.3em] opacity-60">Elite Badminton Analytics</p>
          </div>
        </div>

        <Card className="w-full shadow-2xl border-none overflow-hidden bg-white rounded-[2rem]">
          <Tabs defaultValue="login" className="w-full" onValueChange={(v) => { setIsSignUp(v === 'signup'); setError(null); }}>
            <TabsList className="grid w-full grid-cols-2 rounded-none h-14 bg-muted/5 p-0 border-b border-muted/10">
              <TabsTrigger value="login" className="h-full rounded-none data-[state=active]:bg-white data-[state=active]:shadow-none font-black text-[9px] uppercase tracking-widest">SIGN IN</TabsTrigger>
              <TabsTrigger value="signup" className="h-full rounded-none data-[state=active]:bg-white data-[state=active]:shadow-none font-black text-[9px] uppercase tracking-widest">JOIN ROSTER</TabsTrigger>
            </TabsList>
            
            <CardContent className="p-8 pt-10 space-y-8">
              {error && (
                <Alert variant="destructive" className="bg-destructive/5 border-none rounded-xl animate-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs font-bold">{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleGoogleLogin} 
                variant="outline"
                className="w-full h-14 text-[10px] font-black uppercase tracking-widest gap-3 border-2 border-muted/20 hover:bg-muted/10 rounded-xl shadow-sm group" 
                disabled={isLoggingIn}
              >
                {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <>
                    <svg className="h-5 w-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
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
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-muted-foreground/10" /></div>
                <div className="relative flex justify-center text-[7px] font-black uppercase tracking-[0.4em]"><span className="bg-white px-4 text-muted-foreground">SECURE ACCESS</span></div>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1">Email Identity</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                    <Input id="email" type="email" placeholder="player@pro.com" className="pl-12 h-12 bg-muted/5 border-2 border-muted/10 rounded-xl font-bold focus:ring-primary" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1">Security Key</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                    <Input id="password" type="password" placeholder="••••••••" className="pl-12 h-12 bg-muted/5 border-2 border-muted/10 rounded-xl font-bold focus:ring-primary" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                </div>
                <Button type="submit" className="w-full h-14 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 rounded-xl transition-all hover:-translate-y-1 active:translate-y-0" disabled={isLoggingIn}>
                  {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : (isSignUp ? "Initialize Profile" : "Access Dashboard")}
                </Button>
              </form>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
