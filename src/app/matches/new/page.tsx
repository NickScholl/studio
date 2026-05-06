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
import { UI_STRINGS } from '@/lib/ui-strings';

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
      toast({ title: "Performance Archived", description: "Match synchronized successfully." });
      router.push('/');
    } catch (error: any) {
      console.error("Archive Error:", error);
      toast({ variant: "destructive", title: "Archive Failure", description: error.message });
      setIsSubmitting(false);
    }
  };

  if (isUserLoading) return null;

  return (
    <>
      <AppSidebar />
      <SidebarInset className="flex flex-col bg-[#f8f9fc] w-full min-w-0">
        <header className="flex h-16 md:h-20 shrink-0 items-center gap-4 border-b bg-white/95 backdrop-blur-xl px-4 md:px-8 sticky top-0 z-50 shadow-sm w-full">
          <SidebarTrigger />
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="h-6 w-px bg-muted mx-2" />
          <h1 className="text-lg md:text-xl font-black uppercase tracking-tight">{UI_STRINGS.matchForm.recordAction}</h1>
        </header>

        <main className="max-w-4xl mx-auto p-4 md:p-10 w-full pb-24">
          <Card className="shadow-sm border-none rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-primary/5 p-8 border-b border-muted/20">
              <CardTitle className="text-2xl md:text-3xl font-black tracking-tight text-primary">{UI_STRINGS.matchForm.recordPerformance}</CardTitle>
              <CardDescription className="font-bold text-xs uppercase tracking-widest opacity-60">{UI_STRINGS.matchForm.archiveSession}</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="font-bold text-[10px] uppercase tracking-widest px-1">{UI_STRINGS.matchForm.tacticalDate}</Label>
                    <Input id="date" name="date" type="date" required defaultValue={defaultDate} className="h-11 rounded-xl bg-muted/5 border-none shadow-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time" className="font-bold text-[10px] uppercase tracking-widest px-1">{UI_STRINGS.matchForm.startTime}</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                      <Input id="time" name="time" type="time" required defaultValue={defaultTime} className="pl-10 h-11 rounded-xl bg-muted/5 border-none shadow-sm" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type" className="font-bold text-[10px] uppercase tracking-widest px-1">{UI_STRINGS.matchForm.format}</Label>
                    <Select value={matchType} onValueChange={(v) => setMatchType(v as MatchType)}>
                      <SelectTrigger className="h-11 rounded-xl bg-muted/5 border-none shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-none shadow-xl z-[60]">
                        <SelectItem value="Singles" className="font-bold">Singles</SelectItem>
                        <SelectItem value="Doubles" className="font-bold">Doubles</SelectItem>
                        <SelectItem value="Mixed Doubles" className="font-bold">Mixed Doubles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="competitionName" className="font-bold text-[10px] uppercase tracking-widest px-1">{UI_STRINGS.matchForm.tournament}</Label>
                    <div className="relative">
                      <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                      <Input id="competitionName" name="competitionName" list="competition-list" autoComplete="off" placeholder={UI_STRINGS.matchForm.leaveEmptyTraining} className="pl-10 h-11 rounded-xl bg-muted/5 border-none shadow-sm" />
                      <datalist id="competition-list">
                        {suggestions.competitions.map(c => <option key={c} value={c} />)}
                      </datalist>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location" className="font-bold text-[10px] uppercase tracking-widest px-1">{UI_STRINGS.matchForm.arenaVenue}</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                      <Input id="location" name="location" list="location-list" autoComplete="off" placeholder={UI_STRINGS.matchForm.location} className="pl-10 h-11 rounded-xl bg-muted/5 border-none shadow-sm" required />
                      <datalist id="location-list">
                        {suggestions.locations.map(l => <option key={l} value={l} />)}
                      </datalist>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="result" className="font-bold text-[10px] uppercase tracking-widest px-1">{UI_STRINGS.matchForm.finalResult}</Label>
                  <Select name="result" defaultValue="Win">
                    <SelectTrigger className="h-12 rounded-xl bg-muted/5 border-none shadow-sm font-bold uppercase tracking-widest">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-none shadow-xl z-[60]">
                      <SelectItem value="Win" className="font-bold text-secondary py-3">{UI_STRINGS.common.proWin}</SelectItem>
                      <SelectItem value="Loss" className="font-bold text-destructive py-3">{UI_STRINGS.common.proLoss}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                  <Card className="border-none bg-muted/5 rounded-2xl">
                    <CardHeader className="p-6 pb-4">
                      <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                        <User className="h-4 w-4" /> {UI_STRINGS.matchForm.teamAlpha}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 space-y-4">
                      <Input id="myName" name="myName" list="name-list" autoComplete="off" defaultValue={user?.displayName || ''} required className="h-10 rounded-lg bg-white border-none shadow-sm font-bold" />
                      {isDoubles && (
                        <Input id="partner" name="partner" list="name-list" autoComplete="off" placeholder={UI_STRINGS.matchForm.partnerName} required={isDoubles} className="h-10 rounded-lg bg-white border-none shadow-sm font-bold" />
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-none bg-muted/5 rounded-2xl">
                    <CardHeader className="p-6 pb-4">
                      <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                        <Swords className="h-4 w-4" /> {UI_STRINGS.matchForm.teamOmega}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 space-y-4">
                      <Input id="opponent" name="opponent" list="name-list" autoComplete="off" placeholder={UI_STRINGS.matchForm.rivalName} required className="h-10 rounded-lg bg-white border-none shadow-sm font-bold" />
                      {isDoubles && (
                        <Input id="opponentPartner" name="opponentPartner" list="name-list" autoComplete="off" placeholder={UI_STRINGS.matchForm.rivalPartner} required={isDoubles} className="h-10 rounded-lg bg-white border-none shadow-sm font-bold" />
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6 pt-6 border-t border-muted/20">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-primary" />
                    <Label className="font-black text-lg uppercase tracking-tight">{UI_STRINGS.matchForm.setScores}</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((set) => (
                      <div key={set} className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center block opacity-60">SET {set}</Label>
                        <div className="flex items-center justify-center gap-3">
                          <Input name={`set${set}_mine`} placeholder="00" type="number" required={set < 3} className="text-center h-12 w-16 font-black bg-primary/5 border-none rounded-xl" />
                          <span className="text-muted-foreground/30 font-bold">:</span>
                          <Input name={`set${set}_opp`} placeholder="00" type="number" required={set < 3} className="text-center h-12 w-16 font-black bg-muted/20 border-none rounded-xl" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="font-bold text-[10px] uppercase tracking-widest px-1">{UI_STRINGS.history.deBriefNotes}</Label>
                  <Textarea id="notes" name="notes" placeholder={UI_STRINGS.matchForm.deBriefPlaceholder} className="min-h-[150px] rounded-2xl border-none bg-muted/5 p-4 shadow-sm" />
                </div>

                <div className="pt-8 space-y-4">
                  <Button type="submit" size="lg" className="w-full h-14 md:h-16 font-black uppercase tracking-widest shadow-xl shadow-primary/20 rounded-xl" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin mr-3" /> {UI_STRINGS.common.archiving}</> : <><Check className="h-5 w-5 mr-3" /> {UI_STRINGS.common.archivePerformance}</>}
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
