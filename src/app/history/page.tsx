'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { BadmintonMatch } from '@/lib/match-service';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

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
        <header className="flex h-20 md:h-28 shrink-0 items-center justify-between gap-4 border-b bg-white/95 backdrop-blur-xl px-4 md:px-12 sticky top-0 z-50 shadow-sm w-full">
          <div className="flex items-center gap-4 md:gap-8">
            <SidebarTrigger className="-ml-1 h-10 w-10 md:h-16 md:w-16" />
            <h1 className="text-xl md:text-5xl font-black tracking-tighter uppercase leading-none">History</h1>
          </div>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="block">
            <TabsList className="bg-muted/50 rounded-full p-1 h-10 md:h-16">
              <TabsTrigger value="list" className="gap-2 rounded-full font-black px-4 md:px-12 text-[10px] md:text-lg data-[state=active]:bg-white data-[state=active]:shadow-lg">
                <ListIcon className="h-4 w-4 md:h-6 md:w-6" /> <span className="hidden sm:inline">Timeline</span>
              </TabsTrigger>
              <TabsTrigger value="competition" className="gap-2 rounded-full font-black px-4 md:px-12 text-[10px] md:text-lg data-[state=active]:bg-white data-[state=active]:shadow-lg">
                <Trophy className="h-4 w-4 md:h-6 md:w-6" /> <span className="hidden sm:inline">Tactical Events</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </header>

        <main className="p-4 md:p-16 space-y-12 w-full max-w-[1800px] mx-auto overflow-x-hidden">
          <Card className="border-none shadow-2xl shadow-black/5 bg-white rounded-[2rem] md:rounded-[4rem] overflow-hidden">
            <CardHeader className="pb-4 md:pb-12 border-b border-muted/30 bg-muted/5 px-6 md:px-16 pt-6 md:pt-16">
              <div className="flex items-center gap-3 md:gap-6 text-muted-foreground">
                <Filter className="h-5 w-5 md:h-10 md:w-10" />
                <CardTitle className="text-[10px] md:text-xl font-black uppercase tracking-[0.4em]">Analytics Filtering</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-20 space-y-8 md:space-y-16">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12">
                
                {/* Multi-Select Players */}
                <div className="space-y-3 md:space-y-6">
                  <Label className="text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-widest px-1">Roster Selection</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full h-12 md:h-20 justify-between bg-muted/10 border-none rounded-xl md:rounded-3xl font-black text-sm md:text-2xl px-6 md:px-10">
                        <span className="truncate">
                          {selectedPlayers.length === 0 ? "All Players" : `${selectedPlayers.length} Selected`}
                        </span>
                        <ChevronDown className="h-5 w-5 md:h-8 md:w-8 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] md:w-[450px] p-0 bg-white border-none shadow-2xl rounded-2xl md:rounded-3xl z-[60]" align="start">
                      <ScrollArea className="h-64 md:h-96 p-4">
                        <div className="space-y-4">
                          {uniquePlayers.map(player => (
                            <div key={player} className="flex items-center gap-3 md:gap-5 p-2 md:p-4 hover:bg-muted/10 rounded-xl transition-colors cursor-pointer group" onClick={() => {
                              setSelectedPlayers(prev => prev.includes(player) ? prev.filter(p => p !== player) : [...prev, player])
                            }}>
                              <Checkbox checked={selectedPlayers.includes(player)} className="h-5 w-5 md:h-8 md:w-8 rounded-md md:rounded-lg" />
                              <span className="font-bold text-sm md:text-2xl group-hover:text-primary">{player}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Multi-Select Competitions */}
                <div className="space-y-3 md:space-y-6">
                  <Label className="text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-widest px-1">Tactical Category</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full h-12 md:h-20 justify-between bg-muted/10 border-none rounded-xl md:rounded-3xl font-black text-sm md:text-2xl px-6 md:px-10">
                        <span className="truncate">
                          {selectedCompetitions.length === 0 ? "All Events" : `${selectedCompetitions.length} Selected`}
                        </span>
                        <ChevronDown className="h-5 w-5 md:h-8 md:w-8 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] md:w-[450px] p-0 bg-white border-none shadow-2xl rounded-2xl md:rounded-3xl z-[60]" align="start">
                      <ScrollArea className="h-64 md:h-96 p-4">
                        <div className="space-y-4">
                          {uniqueCompetitions.map(comp => (
                            <div key={comp} className="flex items-center gap-3 md:gap-5 p-2 md:p-4 hover:bg-muted/10 rounded-xl transition-colors cursor-pointer group" onClick={() => {
                              setSelectedCompetitions(prev => prev.includes(comp) ? prev.filter(c => c !== comp) : [...prev, comp])
                            }}>
                              <Checkbox checked={selectedCompetitions.includes(comp)} className="h-5 w-5 md:h-8 md:w-8 rounded-md md:rounded-lg" />
                              <span className="font-bold text-sm md:text-2xl group-hover:text-primary">{comp}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Reset Analytics */}
                <div className="flex items-end">
                  <Button 
                    variant="ghost" 
                    size="lg" 
                    onClick={clearFilters} 
                    className={`w-full h-12 md:h-20 rounded-xl md:rounded-3xl font-black uppercase text-[10px] md:text-lg tracking-widest transition-all ${hasFilters ? 'text-primary bg-primary/5 hover:bg-primary/10' : 'opacity-20 pointer-events-none'}`}
                  >
                    <X className="h-4 w-4 md:h-8 md:w-8 mr-2 md:mr-4" />
                    Reset Analytics
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
                  icon={comp === 'Training' ? <Dumbbell className="h-6 w-6 md:h-12 md:w-12 text-muted-foreground" /> : <Trophy className="h-6 w-6 md:h-12 md:w-12 text-primary" />} 
                  isOfficial={comp !== 'Training'}
                />
              ))
            )}

            {filteredMatches.length === 0 && (
              <div className="text-center py-32 md:py-80 bg-white rounded-[2rem] md:rounded-[5rem] border-8 border-dashed shadow-sm flex flex-col items-center justify-center space-y-8 md:space-y-16">
                <div className="bg-muted/10 p-12 md:p-24 rounded-full">
                  <Activity className="h-16 w-16 md:h-40 md:w-40 text-muted-foreground opacity-10" />
                </div>
                <p className="text-muted-foreground font-black text-xl md:text-5xl tracking-tighter px-6 md:px-24">No match data meets current filter criteria.</p>
                <Button onClick={clearFilters} variant="outline" className="rounded-full px-12 md:px-24 h-16 md:h-32 font-black uppercase text-sm md:text-2xl tracking-[0.3em] border-4">Full Roster Recovery</Button>
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
      <CardHeader className="bg-muted/5 p-6 md:p-20 flex flex-row items-center gap-6 md:gap-12 border-b border-muted/30">
        <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-2xl shadow-black/5">
          {icon || <ListIcon className="h-6 w-6 md:h-12 md:w-12 text-primary" />}
        </div>
        <div className="flex flex-col gap-2 md:gap-4">
          <CardTitle className="text-2xl md:text-7xl font-black tracking-tighter uppercase">{title}</CardTitle>
          {isOfficial && (
            <div className="flex items-center gap-3 text-primary">
              <Check className="h-4 w-4 md:h-8 md:w-8" />
              <span className="text-[10px] md:text-xl font-black uppercase tracking-[0.4em] opacity-60">Verified Official Match</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto w-full">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-muted/10 border-none">
                <TableHead className="w-[200px] md:w-[450px] font-black uppercase text-[10px] md:text-lg tracking-[0.4em] pl-6 md:pl-20 h-20 md:h-32">Tactical Date</TableHead>
                <TableHead className="font-black uppercase text-[10px] md:text-lg tracking-[0.4em] h-20 md:h-32">Roster Matchup</TableHead>
                <TableHead className="font-black uppercase text-[10px] md:text-lg tracking-[0.4em] h-20 md:h-32">Final Scoring</TableHead>
                <TableHead className="text-right font-black uppercase text-[10px] md:text-lg tracking-[0.4em] pr-6 md:pr-20 h-20 md:h-32">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((match) => (
                <TableRow key={match.id} className="hover:bg-muted/5 transition-all border-muted/30">
                  <TableCell className="pl-6 md:pl-20 py-8 md:py-20">
                    <div className="flex flex-col">
                      <span className="font-black text-sm md:text-4xl tracking-tighter leading-none">{new Date(match.matchDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <div className="flex items-center text-[8px] md:text-lg font-black text-muted-foreground mt-2 md:mt-6 uppercase tracking-[0.2em] opacity-40">
                        <Clock className="h-3 w-3 md:h-6 md:w-6 mr-2 md:mr-4 text-primary" />
                        {new Date(match.matchDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-8 md:py-20">
                    <div className="flex flex-col gap-3 md:gap-8">
                      <div className="flex flex-col gap-1 md:gap-4 text-sm md:text-3xl">
                        <div className="flex items-center gap-3 md:gap-6 flex-wrap">
                          <span className="font-black text-primary tracking-tighter">{match.myName}</span>
                          {match.partner && (
                            <span className="text-muted-foreground text-[10px] md:text-2xl font-bold italic">& {match.partner}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 md:gap-6 flex-wrap">
                          <span className="font-black tracking-tighter">{match.opponent}</span>
                          {match.opponentPartner && (
                            <span className="text-muted-foreground text-[10px] md:text-2xl font-bold italic">& {match.opponentPartner}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-8 md:py-20">
                    <div className="flex gap-2 md:gap-6">
                      {match.myScore.map((s, i) => (
                        <span key={i} className={`text-[10px] md:text-2xl px-3 md:px-8 py-2 md:py-5 rounded-xl md:rounded-3xl font-mono font-black shadow-2xl border ${s > match.opponentScore[i] ? 'bg-primary text-white border-primary shadow-primary/30' : 'bg-muted/30 text-muted-foreground border-transparent'}`}>
                          {s}-{match.opponentScore[i]}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6 md:pr-20 py-8 md:py-20">
                    <Badge variant={match.result === 'Win' ? 'secondary' : 'destructive'} className="shadow-2xl shadow-black/5 px-4 md:px-12 py-3 md:py-6 font-black uppercase text-[10px] md:text-lg tracking-[0.3em] rounded-xl md:rounded-3xl border-none">
                      {match.result === 'Win' ? 'PRO WIN' : 'PRO LOSS'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
