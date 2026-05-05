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
      // Limit to 500KB to ensure Firestore doc size limits are respected
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

      // Important: We ONLY update Auth profile photo if it's a standard URL.
      // Giant data URIs in Auth profile can cause session tokens to become too large (400 errors).
      const authUpdate: { displayName: string; photoURL?: string } = {
        displayName: `${formData.firstName} ${formData.lastName}`.trim(),
      };
      
      if (formData.photoURL && !formData.photoURL.startsWith('data:')) {
        authUpdate.photoURL = formData.photoURL;
      }

      await updateProfile(user, authUpdate);

      toast({
        title: "Profile Updated!",
        description: "Your changes have been saved to your player profile.",
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-lg font-headline font-semibold">User Settings</h1>
        </header>

        <main className="max-w-3xl mx-auto p-6 lg:p-10 w-full space-y-6">
          <Card className="shadow-lg border-none">
            <CardHeader className="bg-primary/5">
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Manage your public identity on ShuttleScore.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSave} className="space-y-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="relative group">
                    <Avatar className="h-28 w-28 border-4 border-white shadow-xl">
                      <AvatarImage src={formData.photoURL} className="object-cover" />
                      <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                        {formData.firstName?.charAt(0) || user.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Camera className="h-6 w-6" />
                    </button>
                    <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground p-2 rounded-full shadow-lg border-2 border-white pointer-events-none">
                      <Upload className="h-4 w-4" />
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
                    <div className="space-y-2">
                      <Label htmlFor="photoURL">Avatar Preview</Label>
                      {formData.photoURL.startsWith('data:') ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground italic bg-muted px-2 py-1 rounded">Image uploaded from local file</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-destructive"
                            onClick={() => setFormData(prev => ({ ...prev, photoURL: '' }))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Input 
                          id="photoURL" 
                          name="photoURL" 
                          placeholder="Or paste a direct URL here..." 
                          value={formData.photoURL}
                          onChange={handleChange}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      name="firstName" 
                      value={formData.firstName}
                      onChange={handleChange}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      name="lastName" 
                      value={formData.lastName}
                      onChange={handleChange}
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username / Display Name</Label>
                  <Input 
                    id="username" 
                    name="username" 
                    placeholder="shuttle_master" 
                    value={formData.username}
                    onChange={handleChange}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    This is how other players will see you in match histories.
                  </p>
                </div>

                <div className="pt-6 border-t flex justify-end">
                  <Button type="submit" className="w-full md:w-auto px-8 py-6 text-lg font-bold shadow-lg shadow-primary/20" disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <Save className="h-5 w-5 mr-2" />
                    )}
                    Update Profile
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
