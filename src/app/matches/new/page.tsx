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
      competitionName: formData.get('competitionName') as string,
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
        title: "Tactical Data Archived",
        description: `Your performance stats have been synchronized with the roster.`,
      });
      
      router.push('/');
    } catch (error: any) {
      console.error("Archive Match Error:", error);
      toast({
        variant: "destructive",
        title: "Archival Failure",
        description: error.message || "Failed to secure match data.",
      });
      setIsSubmitting(false);
    }
  };

  if (isUserLoading) return null;

  return (
    <>
      <AppSidebar />
      <SidebarInset className="flex flex-col bg-[#f8f9fc] w-full min-w-0 overflow-x-hidden">
        <header className="flex h-20 md:h-32 shrink-0 items-center gap-4 md:gap-10 border-b bg-white/95 backdrop-blur-xl px-4 md:px-16 sticky top-0 z-50 shadow-sm w-full">
          <div className="flex items-center gap-4 md:gap-12">
            <SidebarTrigger className="-ml-1 h-10 w-10 md:h-20 md:w-20" />
            <Button variant="ghost" size="icon" asChild className="h-10 w-10 md:h-20 md:w-20 hover:bg-primary/5 rounded-2xl md:rounded-[2.5rem]">
              <Link href="/">
                <ChevronLeft className="h-6 w-6 md:h-12 md:w-12" />
              </Link>
            </Button>
            <div className="h-8 w-px bg-muted mx-2 md:mx-6" />
            <h1 className="text-[10px] md:text-xl font-black uppercase tracking-[0.5em] text-primary">Tactical Registry</h1>
          </div>
        </header>

        <main className="max-w-[1600px] mx-auto p-4 md:p-24 w-full pb-64 overflow-x-hidden">
          <Card className="shadow-2xl shadow-black/5 border-none rounded-[2rem] md:rounded-[5rem] overflow-hidden bg-white">
            <CardHeader className="bg-primary/5 px-6 md:px-32 pt-12 md:pt-32 pb-8 md:pb-24 border-b border-muted/30 text-center md:text-left">
              <CardTitle className="text-4xl md:text-[10rem] font-black tracking-tighter text-primary leading-none">Record Action</CardTitle>
              <CardDescription className="text-[10px] md:text-2xl font-black uppercase tracking-[0.4em] text-muted-foreground opacity-60 mt-4 md:mt-10">Document every professional flight of the shuttle</CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-32">
              <form onSubmit={handleSubmit} className="space-y-16 md:space-y-32">
                <div className="grid gap-8 md:gap-20 grid-cols-1 md:grid-cols-3">
                  <div className="space-y-4 md:space-y-8">
                    <Label htmlFor="date" className="font-black text-[10px] md:text-xl uppercase tracking-[0.3em] text-muted-foreground px-1">Tactical Date</Label>
                    <Input 
                      id="date" 
                      name="date" 
                      type="date" 
                      required 
                      defaultValue={defaultDate} 
                      className="h-14 md:h-24 border-none bg-muted/10 rounded-2xl md:rounded-[2rem] font-black text-lg md:text-4xl shadow-inner focus:ring-8 focus:ring-primary/10"
                    />
                  </div>
                  <div className="space-y-4 md:space-y-8">
                    <Label htmlFor="time" className="font-black text-[10px] md:text-xl uppercase tracking-[0.3em] text-muted-foreground px-1">Start Time</Label>
                    <div className="relative">
                      <Clock className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 h-6 w-6 md:h-12 md:w-12 text-primary/60" />
                      <Input 
                        id="time" 
                        name="time" 
                        type="time" 
                        required 
                        defaultValue={defaultTime} 
                        className="pl-14 md:pl-24 h-14 md:h-24 border-none bg-muted/10 rounded-2xl md:rounded-[2rem] font-black text-lg md:text-4xl shadow-inner focus:ring-8 focus:ring-primary/10"
                      />
                    </div>
                  </div>
                  <div className="space-y-4 md:space-y-8">
                    <Label htmlFor="type" className="font-black text-[10px] md:text-xl uppercase tracking-[0.3em] text-muted-foreground px-1">Format</Label>
                    <Select value={matchType} onValueChange={(v) => setMatchType(v as MatchType)}>
                      <SelectTrigger className="h-14 md:h-24 border-none bg-muted/10 rounded-2xl md:rounded-[2rem] focus:ring-8 focus:ring-primary/10 font-black text-lg md:text-4xl shadow-inner">
                        <SelectValue placeholder="Format" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-none shadow-2xl z-[60]">
                        <SelectItem value="Singles" className="font-black text-lg md:text-2xl py-4">Singles</SelectItem>
                        <SelectItem value="Doubles" className="font-black text-lg md:text-2xl py-4">Doubles</SelectItem>
                        <SelectItem value="Mixed Doubles" className="font-black text-lg md:text-2xl py-4">Mixed Doubles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-8 md:gap-20 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-4 md:space-y-8">
                    <Label htmlFor="competitionName" className="font-black text-[10px] md:text-xl uppercase tracking-[0.3em] text-muted-foreground px-1">Tournament (Optional)</Label>
                    <div className="relative">
                      <Trophy className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 h-6 w-6 md:h-12 md:w-12 text-primary/60" />
                      <Input 
                        id="competitionName" 
                        name="competitionName" 
                        list="competition-list"
                        autoComplete="off"
                        placeholder="Leave empty for Training" 
                        className="pl-14 md:pl-24 h-14 md:h-24 border-none bg-muted/10 rounded-2xl md:rounded-[2rem] font-black text-lg md:text-4xl shadow-inner focus:ring-8 focus:ring-primary/10" 
                      />
                      <datalist id="competition-list">
                        {suggestions.competitions.map(c => <option key={c} value={c} />)}
                      </datalist>
                    </div>
                  </div>
                  <div className="space-y-4 md:space-y-8">
                    <Label htmlFor="location" className="font-black text-[10px] md:text-xl uppercase tracking-[0.3em] text-muted-foreground px-1">Arena Venue</Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 h-6 w-6 md:h-12 md:w-12 text-primary/60" />
                      <Input 
                        id="location" 
                        name="location" 
                        list="location-list"
                        autoComplete="off"
                        placeholder="Location" 
                        className="pl-14 md:pl-24 h-14 md:h-24 border-none bg-muted/10 rounded-2xl md:rounded-[2rem] font-black text-lg md:text-4xl shadow-inner focus:ring-8 focus:ring-primary/10" 
                        required 
                      />
                      <datalist id="location-list">
                        {suggestions.locations.map(l => <option key={l} value={l} />)}
                      </datalist>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 md:space-y-10">
                  <Label htmlFor="result" className="font-black text-[10px] md:text-xl uppercase tracking-[0.3em] text-muted-foreground px-1">Final Result</Label>
                  <Select name="result" defaultValue="Win">
                    <SelectTrigger className="h-20 md:h-32 border-none bg-muted/10 rounded-2xl md:rounded-[3rem] font-black uppercase text-sm md:text-3xl tracking-[0.3em] shadow-inner">
                      <SelectValue placeholder="Outcome" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-none shadow-2xl z-[60]">
                      <SelectItem value="Win" className="font-black text-secondary py-6 md:py-10 text-lg md:text-3xl">VICTORY (PRO WIN)</SelectItem>
                      <SelectItem value="Loss" className="font-black text-destructive py-6 md:py-10 text-lg md:text-3xl">DEFEAT (PRO LOSS)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-10 md:gap-20 grid-cols-1 md:grid-cols-2">
                  <Card className="border-none shadow-2xl shadow-black/5 bg-muted/5 rounded-[2rem] md:rounded-[4rem] overflow-hidden">
                    <CardHeader className="pb-8 md:pb-12 bg-primary/10 px-8 md:px-16 pt-8 md:pt-16">
                      <CardTitle className="text-[12px] md:text-2xl font-black uppercase tracking-[0.3em] flex items-center gap-4 md:gap-8 text-primary">
                        <User className="h-5 w-5 md:h-10 md:w-10" /> Team Alpha (You)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8 md:space-y-12 pt-10 md:pt-20 px-8 md:px-16 pb-10 md:pb-24">
                      <div className="space-y-4">
                        <Label htmlFor="myName" className="text-[10px] md:text-lg font-black uppercase tracking-widest text-muted-foreground px-1">Main Player</Label>
                        <Input id="myName" name="myName" list="name-list" autoComplete="off" defaultValue={user?.displayName || ''} required className="h-14 md:h-24 border-none bg-white rounded-2xl md:rounded-[2rem] font-black text-lg md:text-3xl shadow-sm" />
                      </div>
                      {isDoubles && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                          <Label htmlFor="partner" className="text-[10px] md:text-lg font-black uppercase tracking-widest text-muted-foreground px-1">Teammate Partner</Label>
                          <Input id="partner" name="partner" list="name-list" autoComplete="off" placeholder="Partner Name" required={isDoubles} className="h-14 md:h-24 border-none bg-white rounded-2xl md:rounded-[2rem] font-black text-lg md:text-3xl shadow-sm" />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-2xl shadow-black/5 bg-muted/5 rounded-[2rem] md:rounded-[4rem] overflow-hidden">
                    <CardHeader className="pb-8 md:pb-12 bg-muted/20 px-8 md:px-16 pt-8 md:pt-16">
                      <CardTitle className="text-[12px] md:text-2xl font-black uppercase tracking-[0.3em] flex items-center gap-4 md:gap-8 text-muted-foreground">
                        <Swords className="h-5 w-5 md:h-10 md:w-10" /> Team Omega (Rivals)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8 md:space-y-12 pt-10 md:pt-20 px-8 md:px-16 pb-10 md:pb-24">
                      <div className="space-y-4">
                        <Label htmlFor="opponent" className="text-[10px] md:text-lg font-black uppercase tracking-widest text-muted-foreground px-1">Lead Rival</Label>
                        <Input id="opponent" name="opponent" list="name-list" autoComplete="off" placeholder="Rival Name" required className="h-14 md:h-24 border-none bg-white rounded-2xl md:rounded-[2rem] font-black text-lg md:text-3xl shadow-sm" />
                      </div>
                      {isDoubles && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                          <Label htmlFor="opponentPartner" className="text-[10px] md:text-lg font-black uppercase tracking-widest text-muted-foreground px-1">Rival Partner</Label>
                          <Input id="opponentPartner" name="opponentPartner" list="name-list" autoComplete="off" placeholder="Rival Partner" required={isDoubles} className="h-14 md:h-24 border-none bg-white rounded-2xl md:rounded-[2rem] font-black text-lg md:text-3xl shadow-sm" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <datalist id="name-list">
                    {suggestions.names.map(n => <option key={n} value={n} />)}
                  </datalist>
                </div>

                <div className="space-y-16 md:space-y-32 border-t border-muted/30 pt-16 md:pt-32">
                  <div className="flex items-center gap-6 md:gap-12 px-1">
                    <Target className="h-10 w-10 md:h-20 md:w-20 text-primary" />
                    <Label className="font-black text-2xl md:text-7xl tracking-tighter uppercase">Tactical Set Tally</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-24">
                    {[1, 2, 3].map((set) => (
                      <div key={set} className="space-y-6 md:space-y-12">
                        <Label className="text-[12px] md:text-2xl font-black uppercase tracking-[0.5em] text-muted-foreground text-center block opacity-60">
                          {set === 3 ? "Decision Set 3" : `Tactical Set ${set}`}
                        </Label>
                        <div className="flex items-center justify-center gap-6 md:gap-16">
                          <div className="flex flex-col items-center gap-3 md:gap-8">
                            <span className="text-[9px] md:text-xl font-black text-primary/40 uppercase tracking-widest">ALPHA</span>
                            <Input name={`set${set}_mine`} placeholder="00" type="number" required={set < 3} className="text-center h-20 md:h-40 w-24 md:w-56 font-black text-3xl md:text-8xl bg-primary/5 border-none rounded-2xl md:rounded-[3rem] shadow-inner focus:ring-12 focus:ring-primary/10" />
                          </div>
                          <span className="text-muted-foreground/20 font-black text-3xl md:text-9xl mt-8 md:mt-24">:</span>
                          <div className="flex flex-col items-center gap-3 md:gap-8">
                            <span className="text-[9px] md:text-xl font-black text-destructive/40 uppercase tracking-widest">OMEGA</span>
                            <Input name={`set${set}_opp`} placeholder="00" type="number" required={set < 3} className="text-center h-20 md:h-40 w-24 md:w-56 font-black text-3xl md:text-8xl bg-muted/20 border-none rounded-2xl md:rounded-[3rem] shadow-inner focus:ring-12 focus:ring-destructive/10" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6 md:space-y-12">
                  <Label htmlFor="notes" className="font-black text-[10px] md:text-xl uppercase tracking-[0.3em] text-muted-foreground px-1">Tactical De-Brief</Label>
                  <Textarea 
                    id="notes" 
                    name="notes" 
                    placeholder="Document tactical patterns, physical fatigue notes, or winning strategies..." 
                    className="min-h-[250px] md:min-h-[400px] border-none bg-muted/10 rounded-[2rem] md:rounded-[4rem] p-8 md:p-16 text-xl md:text-4xl font-medium shadow-inner focus:ring-12 focus:ring-primary/10" 
                  />
                </div>

                <div className="pt-20 md:pt-40 flex flex-col gap-8 md:gap-16">
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full h-24 md:h-48 font-black text-xl md:text-6xl uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 rounded-[2rem] md:rounded-[4rem] transition-all hover:translate-y-[-10px] active:translate-y-0" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <><Loader2 className="h-10 w-10 md:h-20 md:w-20 animate-spin mr-6 md:mr-12" /> ARCHIVING...</>
                    ) : (
                      <><Check className="h-10 w-10 md:h-20 md:w-20 mr-6 md:mr-12" /> ARCHIVE PERFORMANCE</>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="lg" 
                    className="w-full h-16 md:h-24 font-black text-[11px] md:text-xl uppercase tracking-[0.4em] opacity-40 hover:opacity-100 transition-opacity hover:bg-destructive/5 hover:text-destructive rounded-2xl" 
                    asChild
                    disabled={isSubmitting}
                  >
                    <Link href="/">ABORT PERFORMANCE LOG</Link>
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
