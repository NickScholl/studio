
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
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select an image smaller than 500KB.",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoURL: reader.result as string }));
      };
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

      const authUpdate: { displayName: string; photoURL?: string } = {
        displayName: `${formData.firstName} ${formData.lastName}`.trim(),
      };
      
      if (formData.photoURL && !formData.photoURL.startsWith('data:')) {
        authUpdate.photoURL = formData.photoURL;
      }

      await updateProfile(user, authUpdate);

      toast({
        title: "Profile Updated!",
        description: "Your elite player identity has been synchronized.",
      });
    } catch (error: any) {
      console.error("Update Profile Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (isUserLoading || (user && profileLoading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <header className="flex h-20 shrink-0 items-center gap-4 border-b bg-white/90 backdrop-blur-xl px-8 sticky top-0 z-50 shadow-sm w-full">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase">Player Profile</h1>
        </header>

        <main className="max-w-[1000px] mx-auto p-6 md:p-12 lg:p-20 w-full space-y-12">
          <Card className="shadow-2xl border-none rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-primary/5 p-8 md:p-12 border-b border-muted/30">
              <CardTitle className="text-2xl md:text-4xl font-black tracking-tighter">Elite Information</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-[0.3em] mt-2 opacity-60">Manage your public tactical identity</CardDescription>
            </CardHeader>
            <CardContent className="p-8 md:p-12">
              <form onSubmit={handleSave} className="space-y-12">
                <div className="flex flex-col md:flex-row items-center gap-12">
                  <div className="relative group">
                    <Avatar className="h-40 w-40 border-[8px] border-white shadow-2xl">
                      <AvatarImage src={formData.photoURL} className="object-cover" />
                      <AvatarFallback className="text-5xl font-black bg-primary/10 text-primary uppercase">
                        {formData.firstName?.charAt(0) || user.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"
                    >
                      <Camera className="h-10 w-10" />
                    </button>
                    <div className="absolute -bottom-2 -right-2 bg-primary text-white p-3.5 rounded-full shadow-2xl border-4 border-white">
                      <Upload className="h-6 w-6" />
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                  <div className="flex-1 space-y-4 w-full">
                    <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Avatar Identity</Label>
                    {formData.photoURL.startsWith('data:') ? (
                      <div className="flex items-center gap-4 bg-muted/5 p-4 rounded-2xl border border-dashed border-primary/20">
                        <span className="text-sm font-black text-primary italic">Custom image staged for upload</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl"
                          onClick={() => setFormData(prev => ({ ...prev, photoURL: '' }))}
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    ) : (
                      <Input 
                        id="photoURL" 
                        name="photoURL" 
                        placeholder="Paste global image URL..." 
                        className="h-14 border-none bg-muted/10 rounded-2xl font-bold text-lg shadow-inner focus:ring-4 focus:ring-primary/10" 
                        value={formData.photoURL}
                        onChange={handleChange}
                      />
                    )}
                  </div>
                </div>

                <div className="grid gap-10 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label htmlFor="firstName" className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">First Name</Label>
                    <Input 
                      id="firstName" 
                      name="firstName" 
                      value={formData.firstName}
                      onChange={handleChange}
                      required 
                      className="h-14 border-none bg-muted/10 rounded-2xl font-bold text-lg shadow-inner focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="lastName" className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Last Name</Label>
                    <Input 
                      id="lastName" 
                      name="lastName" 
                      value={formData.lastName}
                      onChange={handleChange}
                      required 
                      className="h-14 border-none bg-muted/10 rounded-2xl font-bold text-lg shadow-inner focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="username" className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Roster Username</Label>
                  <Input 
                    id="username" 
                    name="username" 
                    placeholder="shuttle_master_pro" 
                    value={formData.username}
                    onChange={handleChange}
                    className="h-14 border-none bg-muted/10 rounded-2xl font-black text-lg shadow-inner focus:ring-4 focus:ring-primary/10"
                  />
                  <p className="text-[11px] text-muted-foreground font-bold px-1 opacity-60">
                    This public ID identifies you in all archived match histories.
                  </p>
                </div>

                <div className="pt-12 border-t border-muted/30 flex justify-end">
                  <Button type="submit" className="w-full h-20 md:w-auto px-16 text-xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 rounded-2xl transition-all hover:translate-y-[-4px] active:translate-y-0" disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-6 w-6 animate-spin mr-3" />
                    ) : (
                      <Save className="h-6 w-6 mr-3" />
                    )}
                    Update Identity
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </div>
  );
}
