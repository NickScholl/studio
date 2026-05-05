
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
import { User, Camera, Loader2, Save } from 'lucide-react';
import { updateProfile } from 'firebase/auth';

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [saving, setSaving] = React.useState(false);

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
        photoURL: profile.photoURL || user?.photoURL || '',
      });
    } else if (user) {
      // Fallback to auth data if profile doc doesn't exist yet
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    setSaving(true);
    try {
      // Update Firestore profile
      const profileData = {
        ...formData,
        id: user.uid,
        email: user.email,
        updatedAt: serverTimestamp(),
        createdAt: profile?.createdAt || serverTimestamp(),
      };

      await setDoc(doc(db, 'userProfiles', user.uid), profileData, { merge: true });

      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: `${formData.firstName} ${formData.lastName}`.trim(),
        photoURL: formData.photoURL,
      });

      toast({
        title: "Profile Updated!",
        description: "Your changes have been saved successfully.",
      });
    } catch (error: any) {
      console.error("Update Profile Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile. Please try again.",
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
          <Card className="shadow-lg">
            <CardHeader className="bg-primary/5">
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Manage your public identity on ShuttleScore.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSave} className="space-y-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-2 border-primary/20">
                      <AvatarImage src={formData.photoURL} />
                      <AvatarFallback className="text-2xl">{formData.firstName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground p-1.5 rounded-full shadow-md">
                      <Camera className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 w-full">
                    <Label htmlFor="photoURL">Profile Picture URL</Label>
                    <Input 
                      id="photoURL" 
                      name="photoURL" 
                      placeholder="https://example.com/photo.jpg" 
                      value={formData.photoURL}
                      onChange={handleChange}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Paste a link to an image to use as your profile picture.
                    </p>
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
                    This is how other players will see you in matches.
                  </p>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button type="submit" className="w-full md:w-auto gap-2" disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Account Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You are currently signed in as <span className="font-bold text-foreground">{user.email}</span>.
              </p>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </div>
  );
}
