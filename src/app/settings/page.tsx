
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Camera, Loader2, Save, Upload, X } from 'lucide-react';
import { updateProfile } from 'firebase/auth';

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [saving, setSaving] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'userProfiles', user.uid);
  }, [db, user]);

  const { data: profile, isLoading: profileLoading } = useDoc(userProfileRef);

  const [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    username: '',
    photoURL: '',
  });

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  React.useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        username: profile.username || '',
        photoURL: profile.photoURL || '',
      });
    } else if (user) {
      const names = user.displayName?.split(' ') || ['', ''];
      setFormData({
        firstName: names[0] || '',
        lastName: names.slice(1).join(' ') || '',
        username: user.email?.split('@')[0] || '',
        photoURL: user.photoURL || '',
      });
    }
  }, [profile, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) { 
        toast({ variant: "destructive", title: "File too large", description: "Limit: 500KB." });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, photoURL: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    setSaving(true);
    try {
      const profileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        photoURL: formData.photoURL,
        id: user.uid,
        email: user.email,
        updatedAt: serverTimestamp(),
        createdAt: profile?.createdAt || serverTimestamp(),
      };
      await setDoc(doc(db, 'userProfiles', user.uid), profileData, { merge: true });
      await updateProfile(user, { displayName: `${formData.firstName} ${formData.lastName}`.trim() });
      toast({ title: "Identity Updated", description: "Roster details synchronized." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (isUserLoading || (user && profileLoading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <AppSidebar />
      <SidebarInset className="flex flex-col bg-[#f8f9fc] w-full min-w-0">
        <header className="flex h-16 md:h-20 shrink-0 items-center gap-4 border-b bg-white/95 backdrop-blur-xl px-4 md:px-8 sticky top-0 z-50 shadow-sm w-full">
          <SidebarTrigger />
          <h1 className="text-lg md:text-xl font-black uppercase tracking-tight">Player Identity</h1>
        </header>

        <main className="max-w-3xl mx-auto p-4 md:p-10 w-full space-y-8">
          <Card className="shadow-sm border-none rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-primary/5 p-8 border-b border-muted/20">
              <CardTitle className="text-xl md:text-2xl font-black tracking-tight">Elite Profile</CardTitle>
              <CardDescription className="font-bold text-xs uppercase tracking-widest opacity-60">Manage your tactical roster information</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSave} className="space-y-8">
                <div className="flex flex-col items-center gap-6 md:flex-row">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                      <AvatarImage src={formData.photoURL} className="object-cover" />
                      <AvatarFallback className="text-2xl font-black bg-primary/10 text-primary">
                        {formData.firstName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  </div>
                  <div className="flex-1 space-y-2 w-full">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Avatar Source URL</Label>
                    <Input name="photoURL" placeholder="Global image URL..." value={formData.photoURL} onChange={handleChange} className="h-10 border-none bg-muted/5 rounded-xl shadow-inner font-medium" />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">First Name</Label>
                    <Input name="firstName" value={formData.firstName} onChange={handleChange} required className="h-10 border-none bg-muted/5 rounded-xl shadow-inner font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Last Name</Label>
                    <Input name="lastName" value={formData.lastName} onChange={handleChange} required className="h-10 border-none bg-muted/5 rounded-xl shadow-inner font-bold" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Roster Username</Label>
                  <Input name="username" value={formData.username} onChange={handleChange} className="h-10 border-none bg-muted/5 rounded-xl shadow-inner font-bold" />
                </div>

                <div className="pt-6 border-t border-muted/10 flex justify-end">
                  <Button type="submit" disabled={saving} className="rounded-xl font-black uppercase tracking-widest px-8">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Update Identity
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </>
  );
}
