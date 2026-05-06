'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { BadmintonMatch } from '@/lib/match-service';
import { 
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
  Target,
  Pencil
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
import Link from 'next/link';

export default function MatchHistory() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const [selectedPlayers, setSelectedPlayers] = React.useState<string[]>([]);
  const [selectedCompetitions, setSelectedCompetitions] = React.useState<string[]>([]);
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
      
      return matchesPlayers && matchesCompetition;
    });
  }, [sortedMatches, selectedPlayers, selectedCompetitions]);

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
  };

  const hasFilters = selectedPlayers.length > 0 || selectedCompetitions.length > 0;

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
        <header className="flex h-16 md:h-20 shrink-0 items-center justify-between gap-4 border-b bg-white/95 backdrop-blur-xl px-4 md:px-8 sticky top-0 z-50 shadow-sm w-full">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-lg md:text-xl font-black tracking-tight uppercase">History</h1>
          </div>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="block">
            <TabsList className="bg-muted/50 rounded-full h-10 p-1">
              <TabsTrigger value="list" className="gap-2 rounded-full font-bold px-4 text-xs">
                <ListIcon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Timeline</span>
              </TabsTrigger>
              <TabsTrigger value="competition" className="gap-2 rounded-full font-bold px-4 text-xs">
                <Trophy className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Groups</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </header>

        <main className="p-4 md:p-8 space-y-6 w-full max-w-7xl mx-auto overflow-x-hidden">
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className="pb-4 border-b border-muted/30 bg-muted/5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Filter className="h-4 w-4" />
                <CardTitle className="text-[10px] md:text-xs font-black uppercase tracking-widest">Tactical Filters</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Roster</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between bg-muted/10 border-none rounded-xl font-bold text-xs h-10">
                      <span className="truncate">
                        {selectedPlayers.length === 0 ? "All Players" : `${selectedPlayers.length} Selected`}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 bg-white border-none shadow-xl rounded-xl z-[60]" align="start">
                    <ScrollArea className="h-64 p-2">
                      <div className="space-y-1">
                        {uniquePlayers.map(player => (
                          <div key={player} className="flex items-center gap-3 p-2 hover:bg-muted/10 rounded-lg transition-colors cursor-pointer group" onClick={() => {
                            setSelectedPlayers(prev => prev.includes(player) ? prev.filter(p => p !== player) : [...prev, player])
                          }}>
                            <Checkbox checked={selectedPlayers.includes(player)} className="h-4 w-4" />
                            <span className="font-bold text-sm group-hover:text-primary">{player}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Event</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between bg-muted/10 border-none rounded-xl font-bold text-xs h-10">
                      <span className="truncate">
                        {selectedCompetitions.length === 0 ? "All Events" : `${selectedCompetitions.length} Selected`}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 bg-white border-none shadow-xl rounded-xl z-[60]" align="start">
                    <ScrollArea className="h-64 p-2">
                      <div className="space-y-1">
                        {uniqueCompetitions.map(comp => (
                          <div key={comp} className="flex items-center gap-3 p-2 hover:bg-muted/10 rounded-lg transition-colors cursor-pointer group" onClick={() => {
                            setSelectedCompetitions(prev => prev.includes(comp) ? prev.filter(c => c !== comp) : [...prev, comp])
                          }}>
                            <Checkbox checked={selectedCompetitions.includes(comp)} className="h-4 w-4" />
                            <span className="font-bold text-sm group-hover:text-primary">{comp}</span>
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
                  size="sm" 
                  onClick={clearFilters} 
                  className={`w-full h-10 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${hasFilters ? 'text-primary bg-primary/5 hover:bg-primary/10' : 'opacity-20 pointer-events-none'}`}
                >
                  <X className="h-3 w-3 mr-2" />
                  Reset Tactical
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-8 pb-24">
            {viewMode === 'list' ? (
              <MatchTable title="Tactical History" matches={filteredMatches} />
            ) : (
              Object.entries(groupedByCompetition).map(([comp, compMatches]) => (
                <MatchTable 
                  key={comp} 
                  title={comp} 
                  matches={compMatches} 
                  icon={comp === 'Training' ? <Dumbbell className="h-4 w-4 text-muted-foreground" /> : <Trophy className="h-4 w-4 text-primary" />} 
                  isOfficial={comp !== 'Training'}
                />
              ))
            )}

            {filteredMatches.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl shadow-sm border-2 border-dashed flex flex-col items-center justify-center space-y-4">
                <Activity className="h-10 w-10 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground font-bold text-sm tracking-tight">No match data found.</p>
                <Button onClick={clearFilters} variant="outline" size="sm" className="rounded-full px-6 font-bold uppercase text-[10px] tracking-widest">Clear Tactical Filters</Button>
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
    <Card className="shadow-sm border-none overflow-hidden rounded-2xl bg-white w-full">
      <CardHeader className="bg-muted/5 p-4 flex flex-row items-center gap-4 border-b border-muted/30">
        <div className="bg-white p-2 rounded-lg shadow-sm border border-muted/20">
          {icon || <ListIcon className="h-4 w-4 text-primary" />}
        </div>
        <div className="flex flex-col">
          <CardTitle className="text-sm font-black tracking-tight uppercase">{title}</CardTitle>
          {isOfficial && (
            <div className="flex items-center gap-1.5 text-primary">
              <Check className="h-3 w-3" />
              <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Official Performance</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 divide-y divide-muted/10">
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
        <div className="group flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:p-6 hover:bg-muted/5 transition-all cursor-pointer gap-4 md:gap-0">
          <div className="flex items-center gap-6 w-full md:w-auto">
            <div className="flex flex-col min-w-[100px] md:min-w-[150px]">
              <span className="font-black text-sm tracking-tighter">{new Date(match.matchDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              <div className="flex items-center text-[10px] font-bold text-muted-foreground mt-0.5 uppercase tracking-widest opacity-40">
                <Clock className="h-2.5 w-2.5 mr-1 text-primary" />
                {new Date(match.matchDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="flex flex-col gap-0.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-primary text-xs">{match.myName}</span>
                {match.partner && <span className="text-muted-foreground text-[10px] font-medium italic">& {match.partner}</span>}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs">{match.opponent}</span>
                {match.opponentPartner && <span className="text-muted-foreground text-[10px] font-medium italic">& {match.opponentPartner}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between w-full md:w-auto md:gap-12">
            <div className="flex gap-2">
              {match.myScore.map((s, i) => (
                <span key={i} className={`text-[10px] px-2 py-1 rounded-md font-mono font-black border ${s > match.opponentScore[i] ? 'bg-primary text-white border-primary shadow-sm' : 'bg-muted/30 text-muted-foreground border-transparent'}`}>
                  {s}-{match.opponentScore[i]}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={match.result === 'Win' ? 'secondary' : 'destructive'} className="px-3 py-1 font-black uppercase text-[8px] tracking-widest rounded-lg">
                {match.result === 'Win' ? 'WIN' : 'LOSS'}
              </Badge>
              <Info className="h-4 w-4 text-muted-foreground opacity-20 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      </DialogTrigger>
      
      <DialogContent className="max-w-[95vw] md:max-w-[800px] w-full bg-white border-none rounded-[1.5rem] shadow-2xl p-0 overflow-hidden z-[100] flex flex-col max-h-[90vh] relative">
        <DialogHeader className="bg-slate-50 p-6 md:p-10 border-b border-muted/20 relative shrink-0">
          <div className="flex items-center justify-between mb-4 pr-12">
            <Badge variant="outline" className="bg-white text-primary border-primary/20 font-black uppercase text-[10px] tracking-widest px-3 py-1">
              {match.competitionName || 'Training Performance'}
            </Badge>
            <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
              <Clock className="h-3 w-3" /> {new Date(match.matchDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <DialogTitle className="text-2xl md:text-4xl font-black tracking-tight text-slate-900">Tactical De-brief</DialogTitle>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-[9px] mt-1 opacity-60">Full Archival Match Analysis</p>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-10 space-y-8 md:space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              <Card className="border-none bg-slate-50 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Team Alpha (Elite)</h3>
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-black text-primary">{match.myName}</p>
                  {match.partner && <p className="text-sm font-bold text-slate-400 italic">Teammate: {match.partner}</p>}
                </div>
              </Card>

              <Card className="border-none bg-slate-50 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Swords className="h-5 w-5 text-destructive" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Team Omega (Rivals)</h3>
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-black text-slate-900">{match.opponent}</p>
                  {match.opponentPartner && <p className="text-sm font-bold text-slate-400 italic">Rival Partner: {match.opponentPartner}</p>}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Set Performance Center</h3>
              </div>
              <div className="grid grid-cols-3 gap-3 md:gap-6">
                {match.myScore.map((s, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SET {i+1}</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-xl md:text-3xl font-black ${s > match.opponentScore[i] ? 'text-primary' : 'text-slate-400'}`}>{s}</span>
                      <span className="text-slate-200 font-bold">:</span>
                      <span className={`text-xl md:text-3xl font-black ${match.opponentScore[i] > s ? 'text-destructive' : 'text-slate-400'}`}>{match.opponentScore[i]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-8">
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-slate-400">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Arena Venue</span>
                </div>
                <p className="text-sm font-bold text-slate-700">{match.location}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Session Date</span>
                </div>
                <p className="text-sm font-bold text-slate-700">{new Date(match.matchDate).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>

            <div className="space-y-4 pb-10">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Tactical De-brief Notes</h3>
              <div className="bg-slate-50 p-6 rounded-2xl min-h-[120px]">
                <p className="text-sm font-medium leading-relaxed text-slate-600 whitespace-pre-wrap">
                  {match.notes || 'No tactical notes were recorded for this session.'}
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Floating Edit Action at Bottom Right */}
        <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 z-[110]">
          <Button variant="secondary" size="sm" asChild className="rounded-full shadow-2xl h-10 px-6 p-0 flex items-center justify-center hover:scale-110 transition-transform font-black text-[10px] uppercase tracking-[0.2em] bg-secondary text-white">
            <Link href={`/matches/${match.id}/edit`}>
              EDIT
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
