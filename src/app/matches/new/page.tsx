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
import { MatchService, MatchType, MatchResult, BadmintonMatch } from '@/lib/match-service';
import { ChevronLeft, MapPin, Target, User, Swords, Trophy, Loader2, Check, Clock } from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

export default function NewMatch() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [matchType, setMatchType] = React.useState<MatchType>('Singles');
  const [defaultDate, setDefaultDate] = React.useState('');
  const [defaultTime, setDefaultTime] = React.useState('');

  const isDoubles = matchType === 'Doubles' || matchType === 'Mixed Doubles';

  const matchesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'matches'),
      where('participantUserIds', 'array-contains', user.uid)
    );
  }, [db, user]);

  const { data: previousMatches } = useCollection<BadmintonMatch>(matchesQuery);

  const suggestions = React.useMemo(() => {
    const data = { names: new Set<string>(), competitions: new Set<string>(), locations: new Set<string>() };
    if (!previousMatches) return { names: [], competitions: [], locations: [] };
    
    previousMatches.forEach(m => {
      if (m.myName) data.names.add(m.myName);
      if (m.opponent) data.names.add(m.opponent);
      if (m.partner) data.names.add(m.partner);
      if (m.opponentPartner) data.names.add(m.opponentPartner);
      if (m.competitionName) data.competitions.add(m.competitionName);
      if (m.location) data.locations.add(m.location);
    });

    return {
      names: Array.from(data.names).sort(),
      competitions: Array.from(data.competitions).sort(),
      locations: Array.from(data.locations).sort()
    };
  }, [previousMatches]);

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  React.useEffect(() => {
    const now = new Date();
    setDefaultDate(now.toISOString().split('T')[0]);
    setDefaultTime(now.toTimeString().split(' ')[0].slice(0, 5));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !db || isSubmitting) return;
    
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const matchData = {
      date: formData.get('date') as string,
      time: formData.get('time') as string,
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
    };

    try {
      await MatchService.addMatch(db, user.uid, matchData);
      
      toast({
        title: "Match Archived",
        description: `Your statistics have been updated successfully.`,
      });
      
      router.push('/');
    } catch (error: any) {
      console.error("Save Match Error:", error);
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: error.message || "Failed to archive match data.",
      });
      setIsSubmitting(false);
    }
  };

  if (isUserLoading) return null;

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white/80 backdrop-blur-md px-6 sticky top-0 z-20 shadow-sm w-full">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Button variant="ghost" size="icon" asChild className="h-9 w-9">
              <Link href="/">
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="h-4 w-px bg-muted mx-2" />
            <h1 className="text-[10px] font-black uppercase tracking-widest text-primary">Record Entry</h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-4 md:p-10 w-full pb-32">
          <Card className="shadow-2xl shadow-black/5 border-none rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-primary/5 px-6 md:px-12 pt-8 md:pt-12 pb-6 md:pb-10 border-b border-muted/50 text-center md:text-left">
              <CardTitle className="text-3xl md:text-5xl font-black tracking-tighter text-primary">Match Log</CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Record every flight of the shuttle</CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-12">
              <form onSubmit={handleSubmit} className="space-y-8 md:space-y-12">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Match Date</Label>
                    <Input 
                      id="date" 
                      name="date" 
                      type="date" 
                      required 
                      defaultValue={defaultDate} 
                      className="h-12 border-none bg-muted/10 rounded-xl font-bold shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time" className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Start Time</Label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                      <Input 
                        id="time" 
                        name="time" 
                        type="time" 
                        required 
                        defaultValue={defaultTime} 
                        className="pl-12 h-12 border-none bg-muted/10 rounded-xl font-bold shadow-inner"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type" className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Match Format</Label>
                    <Select value={matchType} onValueChange={(v) => setMatchType(v as MatchType)}>
                      <SelectTrigger className="h-12 border-none bg-muted/10 rounded-xl focus:ring-primary font-bold shadow-inner">
                        <SelectValue placeholder="Format" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-none shadow-2xl z-50">
                        <SelectItem value="Singles" className="font-bold">Singles</SelectItem>
                        <SelectItem value="Doubles" className="font-bold">Doubles</SelectItem>
                        <SelectItem value="Mixed Doubles" className="font-bold">Mixed Doubles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="competitionName" className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Tournament / Event</Label>
                    <div className="relative">
                      <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                      <Input 
                        id="competitionName" 
                        name="competitionName" 
                        list="competition-list"
                        autoComplete="off"
                        placeholder="e.g. City Open" 
                        className="pl-12 h-12 border-none bg-muted/10 rounded-xl font-bold shadow-inner" 
                      />
                      <datalist id="competition-list">
                        {suggestions.competitions.map(c => <option key={c} value={c} />)}
                      </datalist>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location" className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Arena Venue</Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                      <Input 
                        id="location" 
                        name="location" 
                        list="location-list"
                        autoComplete="off"
                        placeholder="e.g. Center Court" 
                        className="pl-12 h-12 border-none bg-muted/10 rounded-xl font-bold shadow-inner" 
                        required 
                      />
                      <datalist id="location-list">
                        {suggestions.locations.map(l => <option key={l} value={l} />)}
                      </datalist>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="result" className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Match Outcome</Label>
                  <Select name="result" defaultValue="Win">
                    <SelectTrigger className="h-12 border-none bg-muted/10 rounded-xl font-black uppercase text-xs tracking-widest shadow-inner">
                      <SelectValue placeholder="Outcome" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-none shadow-2xl z-50">
                      <SelectItem value="Win" className="font-black text-secondary">VICTORY (WIN)</SelectItem>
                      <SelectItem value="Loss" className="font-black text-destructive">DEFEAT (LOSS)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="border-none shadow-xl shadow-black/5 bg-muted/5 rounded-[1.2rem] md:rounded-[2rem] overflow-hidden">
                    <CardHeader className="pb-4 bg-primary/10 px-5 pt-5">
                      <CardTitle className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                        <User className="h-3 w-3" /> Side A (You)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-5 px-5 pb-6">
                      <div className="space-y-1.5">
                        <Label htmlFor="myName" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Primary Player</Label>
                        <Input id="myName" name="myName" list="name-list" autoComplete="off" defaultValue={user?.displayName || ''} required className="h-11 border-none bg-white rounded-xl font-bold shadow-sm" />
                      </div>
                      {isDoubles && (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                          <Label htmlFor="partner" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Partner</Label>
                          <Input id="partner" name="partner" list="name-list" autoComplete="off" placeholder="Teammate Name" required={isDoubles} className="h-11 border-none bg-white rounded-xl font-bold shadow-sm" />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-xl shadow-black/5 bg-muted/5 rounded-[1.2rem] md:rounded-[2rem] overflow-hidden">
                    <CardHeader className="pb-4 bg-muted/20 px-5 pt-5">
                      <CardTitle className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                        <Swords className="h-3 w-3" /> Side B (Rivals)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-5 px-5 pb-6">
                      <div className="space-y-1.5">
                        <Label htmlFor="opponent" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Opponent 1</Label>
                        <Input id="opponent" name="opponent" list="name-list" autoComplete="off" placeholder="Rival Name" required className="h-11 border-none bg-white rounded-xl font-bold shadow-sm" />
                      </div>
                      {isDoubles && (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                          <Label htmlFor="opponentPartner" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Opponent 2</Label>
                          <Input id="opponentPartner" name="opponentPartner" list="name-list" autoComplete="off" placeholder="Rival Partner" required={isDoubles} className="h-11 border-none bg-white rounded-xl font-bold shadow-sm" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <datalist id="name-list">
                    {suggestions.names.map(n => <option key={n} value={n} />)}
                  </datalist>
                </div>

                <div className="space-y-6 md:space-y-8 border-t border-muted/50 pt-8">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <Label className="font-black text-xs uppercase tracking-[0.2em]">Point Tally</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((set) => (
                      <div key={set} className="space-y-3">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center block">
                          {set === 3 ? "Set 3 (Decision)" : `Set ${set}`}
                        </Label>
                        <div className="flex items-center justify-center gap-4">
                          <Input name={`set${set}_mine`} placeholder="YOU" type="number" required={set < 3} className="text-center h-14 w-20 font-black text-2xl bg-primary/5 border-none rounded-2xl shadow-inner" />
                          <span className="text-muted-foreground font-black">:</span>
                          <Input name={`set${set}_opp`} placeholder="THEM" type="number" required={set < 3} className="text-center h-14 w-20 font-black text-2xl bg-muted/20 border-none rounded-2xl shadow-inner" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="notes" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Tactical Notes</Label>
                  <Textarea 
                    id="notes" 
                    name="notes" 
                    placeholder="Strategies, patterns, or physical notes..." 
                    className="min-h-[160px] border-none bg-muted/10 rounded-2xl p-6 font-medium shadow-inner" 
                  />
                </div>

                <div className="pt-10 flex flex-col gap-6">
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full h-24 md:h-16 font-black text-base md:text-sm uppercase tracking-widest shadow-2xl shadow-primary/30 rounded-2xl transition-all hover:-translate-y-1 active:translate-y-0" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <><Loader2 className="h-5 w-5 animate-spin mr-3" /> COMMITTING...</>
                    ) : (
                      <><Check className="h-6 w-6 mr-3" /> ARCHIVE PERFORMANCE</>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="lg" 
                    className="w-full h-14 md:h-16 font-black text-[10px] uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-opacity" 
                    asChild
                    disabled={isSubmitting}
                  >
                    <Link href="/">ABORT ENTRY</Link>
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
