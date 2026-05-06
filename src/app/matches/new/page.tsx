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
    <>
      <AppSidebar />
      <SidebarInset className="flex flex-col bg-[#f8f9fc] w-full min-w-0 overflow-x-hidden">
        <header className="flex h-20 md:h-24 shrink-0 items-center gap-4 md:gap-6 border-b bg-white/95 backdrop-blur-xl px-4 md:px-8 sticky top-0 z-50 shadow-sm w-full">
          <div className="flex items-center gap-3 md:gap-6">
            <SidebarTrigger className="-ml-1 h-10 w-10 md:h-12 md:w-12" />
            <Button variant="ghost" size="icon" asChild className="h-10 w-10 md:h-14 md:w-14 hover:bg-primary/5 rounded-xl md:rounded-2xl">
              <Link href="/">
                <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
              </Link>
            </Button>
            <div className="h-6 w-px bg-muted mx-2 md:mx-4" />
            <h1 className="text-[10px] md:text-sm font-black uppercase tracking-[0.4em] text-primary">Tactical Entry</h1>
          </div>
        </header>

        <main className="max-w-[1400px] mx-auto p-4 md:p-20 w-full pb-64 overflow-x-hidden">
          <Card className="shadow-2xl shadow-black/5 border-none rounded-[2rem] md:rounded-[4rem] overflow-hidden bg-white">
            <CardHeader className="bg-primary/5 px-6 md:px-24 pt-12 md:pt-24 pb-8 md:pb-20 border-b border-muted/30 text-center md:text-left">
              <CardTitle className="text-3xl md:text-8xl font-black tracking-tighter text-primary">Match Log</CardTitle>
              <CardDescription className="text-[10px] md:text-base font-black uppercase tracking-[0.4em] text-muted-foreground opacity-60 mt-3 md:mt-6">Record every flight of the shuttle</CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-24">
              <form onSubmit={handleSubmit} className="space-y-12 md:space-y-24">
                <div className="grid gap-6 md:gap-12 grid-cols-1 md:grid-cols-3">
                  <div className="space-y-3 md:space-y-4">
                    <Label htmlFor="date" className="font-black text-[10px] md:text-[12px] uppercase tracking-[0.3em] text-muted-foreground px-1">Match Date</Label>
                    <Input 
                      id="date" 
                      name="date" 
                      type="date" 
                      required 
                      defaultValue={defaultDate} 
                      className="h-12 md:h-16 border-none bg-muted/10 rounded-xl md:rounded-2xl font-black text-lg md:text-xl shadow-inner focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    <Label htmlFor="time" className="font-black text-[10px] md:text-[12px] uppercase tracking-[0.3em] text-muted-foreground px-1">Start Time</Label>
                    <div className="relative">
                      <Clock className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 h-5 w-5 md:h-6 md:w-6 text-primary/60" />
                      <Input 
                        id="time" 
                        name="time" 
                        type="time" 
                        required 
                        defaultValue={defaultTime} 
                        className="pl-12 md:pl-16 h-12 md:h-16 border-none bg-muted/10 rounded-xl md:rounded-2xl font-black text-lg md:text-xl shadow-inner focus:ring-4 focus:ring-primary/10"
                      />
                    </div>
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    <Label htmlFor="type" className="font-black text-[10px] md:text-[12px] uppercase tracking-[0.3em] text-muted-foreground px-1">Format</Label>
                    <Select value={matchType} onValueChange={(v) => setMatchType(v as MatchType)}>
                      <SelectTrigger className="h-12 md:h-16 border-none bg-muted/10 rounded-xl md:rounded-2xl focus:ring-4 focus:ring-primary/10 font-black text-lg md:text-xl shadow-inner">
                        <SelectValue placeholder="Select Format" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-none shadow-2xl z-50">
                        <SelectItem value="Singles" className="font-black">Singles</SelectItem>
                        <SelectItem value="Doubles" className="font-black">Doubles</SelectItem>
                        <SelectItem value="Mixed Doubles" className="font-black">Mixed Doubles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-6 md:gap-12 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-3 md:space-y-4">
                    <Label htmlFor="competitionName" className="font-black text-[10px] md:text-[12px] uppercase tracking-[0.3em] text-muted-foreground px-1">Tournament / Event</Label>
                    <div className="relative">
                      <Trophy className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 h-5 w-5 md:h-6 md:w-6 text-primary/60" />
                      <Input 
                        id="competitionName" 
                        name="competitionName" 
                        list="competition-list"
                        autoComplete="off"
                        placeholder="e.g. Grand Championship" 
                        className="pl-12 md:pl-16 h-12 md:h-16 border-none bg-muted/10 rounded-xl md:rounded-2xl font-black text-lg md:text-xl shadow-inner focus:ring-4 focus:ring-primary/10" 
                      />
                      <datalist id="competition-list">
                        {suggestions.competitions.map(c => <option key={c} value={c} />)}
                      </datalist>
                    </div>
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    <Label htmlFor="location" className="font-black text-[10px] md:text-[12px] uppercase tracking-[0.3em] text-muted-foreground px-1">Arena Venue</Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 h-5 w-5 md:h-6 md:w-6 text-primary/60" />
                      <Input 
                        id="location" 
                        name="location" 
                        list="location-list"
                        autoComplete="off"
                        placeholder="e.g. Olympic Center" 
                        className="pl-12 md:pl-16 h-12 md:h-16 border-none bg-muted/10 rounded-xl md:rounded-2xl font-black text-lg md:text-xl shadow-inner focus:ring-4 focus:ring-primary/10" 
                        required 
                      />
                      <datalist id="location-list">
                        {suggestions.locations.map(l => <option key={l} value={l} />)}
                      </datalist>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 md:space-y-6">
                  <Label htmlFor="result" className="font-black text-[10px] md:text-[12px] uppercase tracking-[0.3em] text-muted-foreground px-1">Final Outcome</Label>
                  <Select name="result" defaultValue="Win">
                    <SelectTrigger className="h-16 md:h-20 border-none bg-muted/10 rounded-xl md:rounded-2xl font-black uppercase text-sm md:text-base tracking-[0.2em] md:tracking-[0.4em] shadow-inner">
                      <SelectValue placeholder="Select Outcome" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-none shadow-2xl z-50">
                      <SelectItem value="Win" className="font-black text-secondary py-3 md:py-5">VICTORY (PRO WIN)</SelectItem>
                      <SelectItem value="Loss" className="font-black text-destructive py-3 md:py-5">DEFEAT (PRO LOSS)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-8 md:gap-12 grid-cols-1 md:grid-cols-2">
                  <Card className="border-none shadow-2xl shadow-black/5 bg-muted/5 rounded-[1.5rem] md:rounded-[3rem] overflow-hidden">
                    <CardHeader className="pb-6 md:pb-8 bg-primary/10 px-6 md:px-10 pt-6 md:pt-10">
                      <CardTitle className="text-[12px] md:text-[14px] font-black uppercase tracking-[0.3em] flex items-center gap-3 md:gap-4 text-primary">
                        <User className="h-4 w-4 md:h-5 md:w-5" /> Team Alpha (You)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 md:space-y-8 pt-8 md:pt-10 px-6 md:px-10 pb-8 md:pb-12">
                      <div className="space-y-2 md:space-y-3">
                        <Label htmlFor="myName" className="text-[9px] md:text-[11px] font-black uppercase tracking-widest text-muted-foreground px-1">Primary Player</Label>
                        <Input id="myName" name="myName" list="name-list" autoComplete="off" defaultValue={user?.displayName || ''} required className="h-12 md:h-16 border-none bg-white rounded-xl md:rounded-2xl font-black text-lg md:text-xl shadow-sm" />
                      </div>
                      {isDoubles && (
                        <div className="space-y-2 md:space-y-3 animate-in fade-in slide-in-from-top-4">
                          <Label htmlFor="partner" className="text-[9px] md:text-[11px] font-black uppercase tracking-widest text-muted-foreground px-1">Teammate Partner</Label>
                          <Input id="partner" name="partner" list="name-list" autoComplete="off" placeholder="Enter Partner Name" required={isDoubles} className="h-12 md:h-16 border-none bg-white rounded-xl md:rounded-2xl font-black text-lg md:text-xl shadow-sm" />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-2xl shadow-black/5 bg-muted/5 rounded-[1.5rem] md:rounded-[3rem] overflow-hidden">
                    <CardHeader className="pb-6 md:pb-8 bg-muted/20 px-6 md:px-10 pt-6 md:pt-10">
                      <CardTitle className="text-[12px] md:text-[14px] font-black uppercase tracking-[0.3em] flex items-center gap-3 md:gap-4 text-muted-foreground">
                        <Swords className="h-4 w-4 md:h-5 md:w-5" /> Team Omega (Rivals)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 md:space-y-8 pt-8 md:pt-10 px-6 md:px-10 pb-8 md:pb-12">
                      <div className="space-y-2 md:space-y-3">
                        <Label htmlFor="opponent" className="text-[9px] md:text-[11px] font-black uppercase tracking-widest text-muted-foreground px-1">Lead Opponent</Label>
                        <Input id="opponent" name="opponent" list="name-list" autoComplete="off" placeholder="Enter Rival Name" required className="h-12 md:h-16 border-none bg-white rounded-xl md:rounded-2xl font-black text-lg md:text-xl shadow-sm" />
                      </div>
                      {isDoubles && (
                        <div className="space-y-2 md:space-y-3 animate-in fade-in slide-in-from-top-4">
                          <Label htmlFor="opponentPartner" className="text-[9px] md:text-[11px] font-black uppercase tracking-widest text-muted-foreground px-1">Rival Partner</Label>
                          <Input id="opponentPartner" name="opponentPartner" list="name-list" autoComplete="off" placeholder="Enter Rival Partner" required={isDoubles} className="h-12 md:h-16 border-none bg-white rounded-xl md:rounded-2xl font-black text-lg md:text-xl shadow-sm" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <datalist id="name-list">
                    {suggestions.names.map(n => <option key={n} value={n} />)}
                  </datalist>
                </div>

                <div className="space-y-10 md:space-y-16 border-t border-muted/30 pt-12 md:pt-20">
                  <div className="flex items-center gap-4 md:gap-6 px-1">
                    <Target className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                    <Label className="font-black text-xl md:text-4xl tracking-tighter uppercase">Set Performance Tally</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                    {[1, 2, 3].map((set) => (
                      <div key={set} className="space-y-4 md:space-y-6">
                        <Label className="text-[11px] md:text-[13px] font-black uppercase tracking-[0.4em] text-muted-foreground text-center block">
                          {set === 3 ? "Decision Set (3)" : `Tactical Set ${set}`}
                        </Label>
                        <div className="flex items-center justify-center gap-4 md:gap-8">
                          <div className="flex flex-col items-center gap-2 md:gap-3">
                            <span className="text-[8px] md:text-[10px] font-black text-primary/40 uppercase tracking-widest">YOU</span>
                            <Input name={`set${set}_mine`} placeholder="00" type="number" required={set < 3} className="text-center h-16 md:h-24 w-20 md:w-32 font-black text-2xl md:text-5xl bg-primary/5 border-none rounded-xl md:rounded-[2rem] shadow-inner focus:ring-8 focus:ring-primary/10" />
                          </div>
                          <span className="text-muted-foreground/30 font-black text-2xl md:text-5xl mt-4 md:mt-8">:</span>
                          <div className="flex flex-col items-center gap-2 md:gap-3">
                            <span className="text-[8px] md:text-[10px] font-black text-destructive/40 uppercase tracking-widest">RIVAL</span>
                            <Input name={`set${set}_opp`} placeholder="00" type="number" required={set < 3} className="text-center h-16 md:h-24 w-20 md:w-32 font-black text-2xl md:text-5xl bg-muted/20 border-none rounded-xl md:rounded-[2rem] shadow-inner focus:ring-8 focus:ring-primary/10" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 md:space-y-6">
                  <Label htmlFor="notes" className="font-black text-[10px] md:text-[12px] uppercase tracking-[0.3em] text-muted-foreground px-1">Tactical De-Brief</Label>
                  <Textarea 
                    id="notes" 
                    name="notes" 
                    placeholder="Document patterns, physical fatigue notes, or winning strategies..." 
                    className="min-h-[180px] md:min-h-[250px] border-none bg-muted/10 rounded-[1.5rem] md:rounded-[3rem] p-6 md:p-10 text-lg md:text-xl font-medium shadow-inner focus:ring-8 focus:ring-primary/10" 
                  />
                </div>

                <div className="pt-12 md:pt-20 flex flex-col gap-6 md:gap-10">
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full h-24 md:h-28 font-black text-xl md:text-4xl uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 rounded-[1.5rem] md:rounded-[3rem] transition-all md:hover:translate-y-[-6px] active:translate-y-0" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <><Loader2 className="h-6 w-6 md:h-10 md:w-10 animate-spin mr-4 md:mr-6" /> DATA...</>
                    ) : (
                      <><Check className="h-6 w-6 md:h-10 md:w-10 mr-4 md:mr-6" /> ARCHIVE PERFORMANCE</>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="lg" 
                    className="w-full h-16 md:h-20 font-black text-[11px] md:text-[14px] uppercase tracking-[0.3em] md:tracking-[0.4em] opacity-40 hover:opacity-100 transition-opacity hover:bg-destructive/5 hover:text-destructive rounded-xl" 
                    asChild
                    disabled={isSubmitting}
                  >
                    <Link href="/">ABORT RECORDING</Link>
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