
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MatchService, MatchType, MatchResult } from '@/lib/match-service';
import { ChevronLeft, MapPin, Target, User, Swords, Trophy, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore } from '@/firebase';

export default function NewMatch() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [loading, setLoading] = React.useState(false);
  const [matchType, setMatchType] = React.useState<MatchType>('Singles');
  const [defaultDate, setDefaultDate] = React.useState('');

  const isDoubles = matchType === 'Doubles' || matchType === 'Mixed Doubles';

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  React.useEffect(() => {
    setDefaultDate(new Date().toISOString().split('T')[0]);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !db) return;
    
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const matchData = {
      date: formData.get('date') as string,
      type: matchType,
      competitionName: (formData.get('competitionName') as string) || 'Casual / Friendly',
      myName: formData.get('myName') as string,
      opponent: formData.get('opponent') as string,
      partner: isDoubles ? (formData.get('partner') as string) : undefined,
      opponentPartner: isDoubles ? (formData.get('opponentPartner') as string) : undefined,
      location: formData.get('location') as string,
      myScore: [
        Number(formData.get('set1_mine')),
        Number(formData.get('set2_mine')),
        formData.get('set3_mine') ? Number(formData.get('set3_mine')) : 0
      ].filter(score => score > 0),
      opponentScore: [
        Number(formData.get('set1_opp')),
        Number(formData.get('set2_opp')),
        formData.get('set3_opp') ? Number(formData.get('set3_opp')) : 0
      ].filter(score => score > 0),
      result: formData.get('result') as MatchResult,
      notes: formData.get('notes') as string,
      matchDate: formData.get('date') as string,
    };

    try {
      // Crucial: Await the save to ensure it completes before redirecting
      await MatchService.addMatch(db, user.uid, matchData);
      
      toast({
        title: "Match Recorded!",
        description: `Victory has been logged to your history.`,
      });
      
      router.push('/');
      router.refresh();
    } catch (error: any) {
      console.error("Save Match Error:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "Could not save match data. Check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading) return null;

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white sticky top-0 z-10">
          <SidebarTrigger className="-ml-1" />
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-lg font-bold">Record Match Results</h1>
        </header>

        <main className="max-w-3xl mx-auto p-6 lg:p-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="shadow-xl border-none">
            <CardHeader className="bg-primary/5 rounded-t-lg border-b">
              <CardTitle className="text-xl">Match Stats</CardTitle>
              <CardDescription>Log the details of your latest appearance on court.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Match Date</Label>
                    <Input 
                      id="date" 
                      name="date" 
                      type="date" 
                      required 
                      defaultValue={defaultDate} 
                      className="h-12 border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Match Type</Label>
                    <Select value={matchType} onValueChange={(v) => setMatchType(v as MatchType)}>
                      <SelectTrigger className="h-12 border-2 bg-white">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="Singles">Singles</SelectItem>
                        <SelectItem value="Doubles">Doubles</SelectItem>
                        <SelectItem value="Mixed Doubles">Mixed Doubles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="competitionName" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Competition (Optional)</Label>
                    <div className="relative">
                      <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="competitionName" name="competitionName" placeholder="e.g. Club Finals" className="pl-12 h-12 border-2" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Venue</Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="location" name="location" placeholder="e.g. Sports Hub" className="pl-12 h-12 border-2" required />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="result" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Overall Result</Label>
                  <Select name="result" defaultValue="Win">
                    <SelectTrigger className="h-12 border-2 bg-white">
                      <SelectValue placeholder="Match outcome" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="Win">Victory (Win)</SelectItem>
                      <SelectItem value="Loss">Defeat (Loss)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                  <Card className="border-2 shadow-none bg-muted/5">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-sm font-black uppercase tracking-tighter flex items-center gap-2 text-primary">
                        <User className="h-4 w-4" /> Team 1
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="myName" className="text-[10px] font-bold uppercase">Main Player</Label>
                        <Input id="myName" name="myName" defaultValue={user?.displayName || ''} required className="bg-white" />
                      </div>
                      {isDoubles && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                          <Label htmlFor="partner" className="text-[10px] font-bold uppercase">Partner</Label>
                          <Input id="partner" name="partner" placeholder="Partner Name" required={isDoubles} className="bg-white" />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-2 shadow-none bg-muted/5">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-sm font-black uppercase tracking-tighter flex items-center gap-2 text-muted-foreground">
                        <Swords className="h-4 w-4" /> Team 2
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="opponent" className="text-[10px] font-bold uppercase">Opponent 1</Label>
                        <Input id="opponent" name="opponent" placeholder="Opponent Name" required className="bg-white" />
                      </div>
                      {isDoubles && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                          <Label htmlFor="opponentPartner" className="text-[10px] font-bold uppercase">Opponent 2</Label>
                          <Input id="opponentPartner" name="opponentPartner" placeholder="Opponent Partner" required={isDoubles} className="bg-white" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6 border-t pt-8">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <Label className="font-black text-xs uppercase tracking-widest">Set-by-Set Scores</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Set 1</Label>
                      <div className="flex gap-2">
                        <Input name="set1_mine" placeholder="T1" type="number" required className="text-center font-bold" />
                        <Input name="set1_opp" placeholder="T2" type="number" required className="text-center font-bold" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Set 2</Label>
                      <div className="flex gap-2">
                        <Input name="set2_mine" placeholder="T1" type="number" required className="text-center font-bold" />
                        <Input name="set2_opp" placeholder="T2" type="number" required className="text-center font-bold" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Set 3 (If played)</Label>
                      <div className="flex gap-2">
                        <Input name="set3_mine" placeholder="T1" type="number" className="text-center font-bold" />
                        <Input name="set3_opp" placeholder="T2" type="number" className="text-center font-bold" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Post-Match Notes</Label>
                  <Textarea id="notes" name="notes" placeholder="Performance details, strategies used, or areas to improve..." className="min-h-[120px] border-2" />
                </div>

                <div className="pt-8 flex flex-col md:flex-row gap-4">
                  <Button type="submit" size="lg" className="flex-1 h-14 font-bold text-base shadow-lg shadow-primary/30" disabled={loading}>
                    {loading ? (
                      <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Saving...</>
                    ) : "Commit Match Result"}
                  </Button>
                  <Button type="button" variant="outline" size="lg" className="h-14 font-bold" asChild>
                    <Link href="/">Cancel</Link>
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
