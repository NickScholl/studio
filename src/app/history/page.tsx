'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { BadmintonMatch } from '@/lib/match-service';
import { 
  Search, 
  X, 
  Activity, 
  Filter, 
  Trophy, 
  List as ListIcon, 
  Clock, 
  Users, 
  Dumbbell, 
  Check,
  ChevronDown,
  MapPin,
  Calendar,
  Swords,
  Info,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function MatchHistory() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const [selectedPlayers, setSelectedPlayers] = React.useState<string[]>([]);
  const [selectedCompetitions, setSelectedCompetitions] = React.useState<string[]>([]);
  const [filterType, setFilterType] = React.useState<string>('all');
  const [filterResult, setFilterResult] = React.useState<string>('all');
  const [viewMode, setViewMode] = React.useState<'list' | 'competition'>('list');

  const matchesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'matches'),
      where('participantUserIds', 'array-contains', user.uid)
    );
  }, [db, user]);

  const { data: rawMatches, isLoading: matchesLoading } = useCollection<BadmintonMatch>(matchesQuery);

  const sortedMatches = React.useMemo(() => {
    if (!rawMatches) return [];
    return [...rawMatches].sort((a, b) => 
      new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()
    );
  }, [rawMatches]);

  const uniquePlayers = React.useMemo(() => {
    const players = new Set<string>();
    sortedMatches.forEach(m => {
      if (m.myName) players.add(m.myName);
      if (m.opponent) players.add(m.opponent);
      if (m.partner) players.add(m.partner);
      if (m.opponentPartner) players.add(m.opponentPartner);
    });
    return Array.from(players).sort();
  }, [sortedMatches]);

  const uniqueCompetitions = React.useMemo(() => {
    const competitions = sortedMatches.map(m => m.competitionName || 'Training').filter(Boolean);
    return Array.from(new Set(competitions)).sort();
  }, [sortedMatches]);

  const filteredMatches = React.useMemo(() => {
    return sortedMatches.filter(m => {
      const playerPool = [m.myName, m.opponent, m.partner, m.opponentPartner].filter(Boolean);
      const matchesPlayers = selectedPlayers.length === 0 || selectedPlayers.some(p => playerPool.includes(p));
      
      const compName = m.competitionName || 'Training';
      const matchesCompetition = selectedCompetitions.length === 0 || selectedCompetitions.includes(compName);
      
      const matchesType = filterType === 'all' || m.matchType === filterType;
      const matchesResult = filterResult === 'all' || m.result === filterResult;

      return matchesPlayers && matchesCompetition && matchesType && matchesResult;
    });
  }, [sortedMatches, selectedPlayers, selectedCompetitions, filterType, filterResult]);

  const groupedByCompetition = React.useMemo(() => {
    const groups: Record<string, BadmintonMatch[]> = {};
    filteredMatches.forEach(m => {
      const comp = m.competitionName || 'Training';
      if (!groups[comp]) groups[comp] = [];
      groups[comp].push(m);
    });
    return groups;
  }, [filteredMatches]);

  const clearFilters = () => {
    setSelectedPlayers([]);
    setSelectedCompetitions([]);
    setFilterType('all');
    setFilterResult('all');
  };

  const hasFilters = selectedPlayers.length > 0 || 
                     selectedCompetitions.length > 0 || 
                     filterType !== 'all' || 
                     filterResult !== 'all';

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || (user && matchesLoading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Activity className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <AppSidebar />
      <SidebarInset className="flex flex-col bg-[#f8f9fc] w-full min-w-0 overflow-x-hidden">
        <header className="flex h-20 md:h-32 shrink-0 items-center justify-between gap-4 border-b bg-white/95 backdrop-blur-xl px-4 md:px-12 sticky top-0 z-50 shadow-sm w-full">
          <div className="flex items-center gap-4 md:gap-8">
            <SidebarTrigger className="-ml-1 h-10 w-10 md:h-20 md:w-20" />
            <h1 className="text-xl md:text-6xl font-black tracking-tighter uppercase leading-none">History</h1>
          </div>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="block">
            <TabsList className="bg-muted/50 rounded-full p-1 h-10 md:h-20">
              <TabsTrigger value="list" className="gap-2 rounded-full font-black px-4 md:px-16 text-[10px] md:text-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg">
                <ListIcon className="h-4 w-4 md:h-10 md:w-10" /> <span className="hidden sm:inline">Timeline</span>
              </TabsTrigger>
              <TabsTrigger value="competition" className="gap-2 rounded-full font-black px-4 md:px-16 text-[10px] md:text-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg">
                <Trophy className="h-4 w-4 md:h-10 md:w-10" /> <span className="hidden sm:inline">Groups</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </header>

        <main className="p-4 md:p-16 space-y-12 w-full max-w-none mx-auto overflow-x-hidden">
          <Card className="border-none shadow-2xl shadow-black/5 bg-white rounded-[2rem] md:rounded-[4rem] overflow-hidden">
            <CardHeader className="pb-4 md:pb-12 border-b border-muted/30 bg-muted/5 px-6 md:px-16 pt-6 md:pt-16">
              <div className="flex items-center gap-3 md:gap-6 text-muted-foreground">
                <Filter className="h-5 w-5 md:h-12 md:w-12" />
                <CardTitle className="text-[10px] md:text-2xl font-black uppercase tracking-[0.4em]">Analytics Filtering</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-20 space-y-8 md:space-y-16">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
                <div className="space-y-3 md:space-y-6">
                  <Label className="text-[10px] md:text-lg font-black text-muted-foreground uppercase tracking-widest px-1">Roster Selection</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full h-12 md:h-24 justify-between bg-muted/10 border-none rounded-xl md:rounded-3xl font-black text-sm md:text-3xl px-6 md:px-12">
                        <span className="truncate">
                          {selectedPlayers.length === 0 ? "All Players" : `${selectedPlayers.length} Selected`}
                        </span>
                        <ChevronDown className="h-5 w-5 md:h-10 md:w-10 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] md:w-[600px] p-0 bg-white border-none shadow-2xl rounded-2xl md:rounded-3xl z-[60]" align="start">
                      <ScrollArea className="h-64 md:h-[600px] p-4 md:p-8">
                        <div className="space-y-4">
                          {uniquePlayers.map(player => (
                            <div key={player} className="flex items-center gap-3 md:gap-6 p-2 md:p-6 hover:bg-muted/10 rounded-xl transition-colors cursor-pointer group" onClick={() => {
                              setSelectedPlayers(prev => prev.includes(player) ? prev.filter(p => p !== player) : [...prev, player])
                            }}>
                              <Checkbox checked={selectedPlayers.includes(player)} className="h-5 w-5 md:h-10 md:w-10 rounded-md md:rounded-xl" />
                              <span className="font-bold text-sm md:text-3xl group-hover:text-primary">{player}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-3 md:space-y-6">
                  <Label className="text-[10px] md:text-lg font-black text-muted-foreground uppercase tracking-widest px-1">Event Category</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full h-12 md:h-24 justify-between bg-muted/10 border-none rounded-xl md:rounded-3xl font-black text-sm md:text-3xl px-6 md:px-12">
                        <span className="truncate">
                          {selectedCompetitions.length === 0 ? "All Events" : `${selectedCompetitions.length} Selected`}
                        </span>
                        <ChevronDown className="h-5 w-5 md:h-10 md:w-10 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] md:w-[600px] p-0 bg-white border-none shadow-2xl rounded-2xl md:rounded-3xl z-[60]" align="start">
                      <ScrollArea className="h-64 md:h-[600px] p-4 md:p-8">
                        <div className="space-y-4">
                          {uniqueCompetitions.map(comp => (
                            <div key={comp} className="flex items-center gap-3 md:gap-6 p-2 md:p-6 hover:bg-muted/10 rounded-xl transition-colors cursor-pointer group" onClick={() => {
                              setSelectedCompetitions(prev => prev.includes(comp) ? prev.filter(c => c !== comp) : [...prev, comp])
                            }}>
                              <Checkbox checked={selectedCompetitions.includes(comp)} className="h-5 w-5 md:h-10 md:w-10 rounded-md md:rounded-xl" />
                              <span className="font-bold text-sm md:text-3xl group-hover:text-primary">{comp}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-end">
                  <Button 
                    variant="ghost" 
                    size="lg" 
                    onClick={clearFilters} 
                    className={`w-full h-12 md:h-24 rounded-xl md:rounded-3xl font-black uppercase text-[10px] md:text-xl tracking-widest transition-all ${hasFilters ? 'text-primary bg-primary/5 hover:bg-primary/10' : 'opacity-20 pointer-events-none'}`}
                  >
                    <X className="h-4 w-4 md:h-10 md:w-10 mr-2 md:mr-4" />
                    Reset Tactical
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-12 md:space-y-32 pb-48">
            {viewMode === 'list' ? (
              <MatchTable title="Tactical History" matches={filteredMatches} />
            ) : (
              Object.entries(groupedByCompetition).map(([comp, compMatches]) => (
                <MatchTable 
                  key={comp} 
                  title={comp} 
                  matches={compMatches} 
                  icon={comp === 'Training' ? <Dumbbell className="h-6 w-6 md:h-14 md:w-14 text-muted-foreground" /> : <Trophy className="h-6 w-6 md:h-14 md:w-14 text-primary" />} 
                  isOfficial={comp !== 'Training'}
                />
              ))
            )}

            {filteredMatches.length === 0 && (
              <div className="text-center py-32 md:py-64 bg-white rounded-[2rem] md:rounded-[5rem] border-8 border-dashed shadow-sm flex flex-col items-center justify-center space-y-8 md:space-y-16">
                <div className="bg-muted/10 p-12 md:p-32 rounded-full">
                  <Activity className="h-16 w-16 md:h-48 md:w-48 text-muted-foreground opacity-10" />
                </div>
                <p className="text-muted-foreground font-black text-xl md:text-6xl tracking-tighter px-6 md:px-24">No match data meets criteria.</p>
                <Button onClick={clearFilters} variant="outline" className="rounded-full px-12 md:px-24 h-16 md:h-40 font-black uppercase text-sm md:text-4xl tracking-[0.3em] border-4">Full Recovery</Button>
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
    </>
  );
}

function MatchTable({ title, matches, icon, isOfficial }: { title: string, matches: BadmintonMatch[], icon?: React.ReactNode, isOfficial?: boolean }) {
  if (matches.length === 0) return null;

  return (
    <Card className="shadow-2xl shadow-black/5 border-none overflow-hidden rounded-[2rem] md:rounded-[5rem] bg-white transition-all w-full">
      <CardHeader className="bg-muted/5 p-6 md:p-24 flex flex-row items-center gap-6 md:gap-16 border-b border-muted/30">
        <div className="bg-white p-4 md:p-12 rounded-2xl md:rounded-[3rem] shadow-2xl shadow-black/5">
          {icon || <ListIcon className="h-6 w-6 md:h-16 md:w-16 text-primary" />}
        </div>
        <div className="flex flex-col gap-2 md:gap-6">
          <CardTitle className="text-2xl md:text-9xl font-black tracking-tighter uppercase">{title}</CardTitle>
          {isOfficial && (
            <div className="flex items-center gap-3 text-primary">
              <Check className="h-4 w-4 md:h-10 md:w-10" />
              <span className="text-[10px] md:text-2xl font-black uppercase tracking-[0.4em] opacity-60">Verified Official Match</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 divide-y divide-muted/20">
          {matches.map((match) => (
            <MatchRow key={match.id} match={match} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MatchRow({ match }: { match: BadmintonMatch }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="group flex flex-col md:flex-row items-start md:items-center justify-between p-6 md:p-20 hover:bg-muted/5 transition-all cursor-pointer gap-6 md:gap-0">
          <div className="flex items-center gap-4 md:gap-16 w-full md:w-auto">
            <div className="flex flex-col min-w-[80px] md:min-w-[300px]">
              <span className="font-black text-sm md:text-5xl tracking-tighter leading-none">{new Date(match.matchDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <div className="flex items-center text-[8px] md:text-2xl font-black text-muted-foreground mt-2 md:mt-10 uppercase tracking-[0.2em] opacity-40">
                <Clock className="h-3 w-3 md:h-8 md:w-8 mr-2 md:mr-5 text-primary" />
                {new Date(match.matchDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="flex flex-col gap-1 md:gap-6 flex-1">
              <div className="flex items-center gap-2 md:gap-8 flex-wrap">
                <span className="font-black text-primary text-xs md:text-5xl tracking-tighter">{match.myName}</span>
                {match.partner && <span className="text-muted-foreground text-[8px] md:text-2xl font-bold italic">& {match.partner}</span>}
              </div>
              <div className="flex items-center gap-2 md:gap-8 flex-wrap">
                <span className="font-black text-xs md:text-5xl tracking-tighter">{match.opponent}</span>
                {match.opponentPartner && <span className="text-muted-foreground text-[8px] md:text-2xl font-bold italic">& {match.opponentPartner}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between w-full md:w-auto md:gap-24">
            <div className="flex gap-2 md:gap-8">
              {match.myScore.map((s, i) => (
                <span key={i} className={`text-[10px] md:text-3xl px-3 md:px-12 py-2 md:py-8 rounded-xl md:rounded-[2.5rem] font-mono font-black shadow-xl border ${s > match.opponentScore[i] ? 'bg-primary text-white border-primary shadow-primary/30' : 'bg-muted/30 text-muted-foreground border-transparent'}`}>
                  {s}-{match.opponentScore[i]}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4 md:gap-12">
              <Badge variant={match.result === 'Win' ? 'secondary' : 'destructive'} className="shadow-2xl shadow-black/5 px-4 md:px-16 py-3 md:py-10 font-black uppercase text-[10px] md:text-2xl tracking-[0.3em] rounded-xl md:rounded-[3rem] border-none">
                {match.result === 'Win' ? 'PRO WIN' : 'PRO LOSS'}
              </Badge>
              <Info className="h-5 w-5 md:h-12 md:w-12 text-muted-foreground opacity-20 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      </DialogTrigger>
      
      <DialogContent className="max-w-[95vw] md:max-w-[1200px] w-full bg-white border-none rounded-[2rem] md:rounded-[5rem] shadow-2xl p-0 overflow-hidden z-[100]">
        <DialogHeader className="bg-primary/5 p-8 md:p-24 border-b border-muted/30">
          <div className="flex items-center justify-between mb-8">
            <Badge variant="outline" className="bg-white/50 text-primary border-primary/20 px-4 md:px-12 py-2 md:py-6 font-black uppercase text-[10px] md:text-2xl tracking-[0.4em] rounded-full">
              {match.competitionName || 'Training Performance'}
            </Badge>
            <span className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] md:text-2xl flex items-center gap-4">
              <Clock className="h-4 w-4 md:h-10 md:w-10" /> {new Date(match.matchDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <DialogTitle className="text-4xl md:text-[8rem] font-black tracking-tighter text-foreground leading-none">Match Analytics</DialogTitle>
          <p className="text-muted-foreground font-black uppercase tracking-[0.4em] text-[10px] md:text-2xl mt-4 opacity-60">Full Tactical De-Brief</p>
        </DialogHeader>

        <div className="p-8 md:p-24 space-y-12 md:space-y-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-24">
            <Card className="border-none bg-muted/5 rounded-[2rem] md:rounded-[4rem] p-8 md:p-16">
              <div className="flex items-center gap-6 md:gap-12 mb-8 md:mb-16">
                <Users className="h-8 w-8 md:h-20 md:w-20 text-primary" />
                <h3 className="text-xl md:text-6xl font-black uppercase tracking-tight">Roster Alpha</h3>
              </div>
              <div className="space-y-4 md:space-y-10">
                <p className="text-2xl md:text-6xl font-black text-primary">{match.myName}</p>
                {match.partner && <p className="text-lg md:text-4xl font-bold text-muted-foreground italic">Partner: {match.partner}</p>}
              </div>
            </Card>

            <Card className="border-none bg-muted/5 rounded-[2rem] md:rounded-[4rem] p-8 md:p-16">
              <div className="flex items-center gap-6 md:gap-12 mb-8 md:mb-16">
                <Swords className="h-8 w-8 md:h-20 md:w-20 text-destructive" />
                <h3 className="text-xl md:text-6xl font-black uppercase tracking-tight">Roster Omega</h3>
              </div>
              <div className="space-y-4 md:space-y-10">
                <p className="text-2xl md:text-6xl font-black">{match.opponent}</p>
                {match.opponentPartner && <p className="text-lg md:text-4xl font-bold text-muted-foreground italic">Partner: {match.opponentPartner}</p>}
              </div>
            </Card>
          </div>

          <div className="space-y-8 md:space-y-16">
            <div className="flex items-center gap-6 md:gap-12">
              <Target className="h-8 w-8 md:h-20 md:w-20 text-primary" />
              <h3 className="text-xl md:text-6xl font-black uppercase tracking-tight">Set Performance</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 md:gap-16">
              {match.myScore.map((s, i) => (
                <div key={i} className="flex flex-col items-center gap-4 md:gap-10 p-4 md:p-12 bg-white rounded-[1.5rem] md:rounded-[3rem] shadow-xl border border-muted/20">
                  <span className="text-[10px] md:text-2xl font-black text-muted-foreground uppercase tracking-widest">SET {i+1}</span>
                  <div className="flex items-center gap-4 md:gap-12">
                    <span className={`text-2xl md:text-9xl font-black ${s > match.opponentScore[i] ? 'text-primary' : 'text-muted-foreground'}`}>{s}</span>
                    <span className="text-xl md:text-6xl font-black opacity-10">:</span>
                    <span className={`text-2xl md:text-9xl font-black ${match.opponentScore[i] > s ? 'text-destructive' : 'text-muted-foreground'}`}>{match.opponentScore[i]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-24">
            <div className="space-y-6 md:space-y-12">
              <div className="flex items-center gap-6 md:gap-12">
                <MapPin className="h-6 w-6 md:h-16 md:w-16 text-primary" />
                <h3 className="text-xl md:text-5xl font-black uppercase tracking-tight">Venue</h3>
              </div>
              <p className="text-lg md:text-5xl font-bold opacity-70">{match.location}</p>
            </div>
            <div className="space-y-6 md:space-y-12">
              <div className="flex items-center gap-6 md:gap-12">
                <Calendar className="h-6 w-6 md:h-16 md:w-16 text-primary" />
                <h3 className="text-xl md:text-5xl font-black uppercase tracking-tight">Full Date</h3>
              </div>
              <p className="text-lg md:text-5xl font-bold opacity-70">{new Date(match.matchDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>

          <div className="space-y-8 md:space-y-16">
            <h3 className="text-xl md:text-6xl font-black uppercase tracking-tight">Tactical De-Brief</h3>
            <div className="bg-muted/10 p-8 md:p-20 rounded-[2rem] md:rounded-[4rem] min-h-[150px] md:min-h-[300px]">
              <p className="text-lg md:text-4xl font-medium leading-relaxed opacity-80 whitespace-pre-wrap">
                {match.notes || 'No tactical notes recorded for this performance.'}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
