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
import { Search, MapPin, Swords, X, Activity, Filter, Trophy, List as ListIcon, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MatchHistory() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterType, setFilterType] = React.useState<string>('all');
  const [filterResult, setFilterResult] = React.useState<string>('all');
  const [filterCompetition, setFilterCompetition] = React.useState<string>('all');
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

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const uniqueCompetitions = React.useMemo(() => {
    const competitions = sortedMatches.map(m => m.competitionName).filter(Boolean);
    return Array.from(new Set(competitions)).sort();
  }, [sortedMatches]);

  const filteredMatches = React.useMemo(() => {
    return sortedMatches.filter(m => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || (
        m.myName.toLowerCase().includes(search) ||
        m.opponent.toLowerCase().includes(search) ||
        (m.partner && m.partner.toLowerCase().includes(search)) ||
        (m.opponentPartner && m.opponentPartner.toLowerCase().includes(search)) ||
        (m.competitionName && m.competitionName.toLowerCase().includes(search))
      );
      const matchesType = filterType === 'all' || m.matchType === filterType;
      const matchesResult = filterResult === 'all' || m.result === filterResult;
      const matchesCompetition = filterCompetition === 'all' || m.competitionName === filterCompetition;

      return matchesSearch && matchesType && matchesResult && matchesCompetition;
    });
  }, [sortedMatches, searchTerm, filterType, filterResult, filterCompetition]);

  const groupedByCompetition = React.useMemo(() => {
    const groups: Record<string, BadmintonMatch[]> = {};
    filteredMatches.forEach(m => {
      const comp = m.competitionName || 'Casual / Friendly';
      if (!groups[comp]) groups[comp] = [];
      groups[comp].push(m);
    });
    return groups;
  }, [filteredMatches]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterResult('all');
    setFilterCompetition('all');
  };

  const hasFilters = searchTerm !== '' || 
                     filterType !== 'all' || 
                     filterResult !== 'all' || 
                     filterCompetition !== 'all';

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
        <header className="flex h-20 md:h-24 shrink-0 items-center justify-between gap-4 border-b bg-white/95 backdrop-blur-xl px-4 md:px-8 sticky top-0 z-50 shadow-sm w-full">
          <div className="flex items-center gap-4 md:gap-6">
            <SidebarTrigger className="-ml-1 h-10 w-10 md:h-12 md:w-12" />
            <h1 className="text-xl md:text-3xl font-black tracking-tighter uppercase">History</h1>
          </div>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="block">
            <TabsList className="bg-muted/50 rounded-full p-1 h-10 md:h-14">
              <TabsTrigger value="list" className="gap-2 rounded-full font-black px-4 md:px-8 text-[10px] md:text-sm data-[state=active]:bg-white data-[state=active]:shadow-lg">
                <ListIcon className="h-4 w-4" /> <span className="hidden sm:inline">List</span>
              </TabsTrigger>
              <TabsTrigger value="competition" className="gap-2 rounded-full font-black px-4 md:px-8 text-[10px] md:text-sm data-[state=active]:bg-white data-[state=active]:shadow-lg">
                <Trophy className="h-4 w-4" /> <span className="hidden sm:inline">Events</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </header>

        <main className="p-4 md:p-16 space-y-12 w-full max-w-[1800px] mx-auto overflow-x-hidden">
          <Card className="border-none shadow-2xl shadow-black/5 bg-white rounded-[2rem] md:rounded-[3rem] overflow-hidden">
            <CardHeader className="pb-4 md:pb-8 border-b border-muted/30 bg-muted/5 px-6 md:px-10 pt-6 md:pt-10">
              <div className="flex items-center gap-3 md:gap-4 text-muted-foreground">
                <Filter className="h-5 w-5 md:h-6 md:w-6" />
                <CardTitle className="text-[12px] md:text-[14px] font-black uppercase tracking-[0.3em]">Advanced Filters</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-14 space-y-8 md:space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                <div className="space-y-3 md:space-y-4">
                  <Label className="text-[10px] md:text-[11px] font-black text-muted-foreground uppercase tracking-widest px-1">Search Rosters</Label>
                  <div className="relative group">
                    <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 h-5 w-5 md:h-6 md:w-6 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
                    <Input 
                      placeholder="Player or Tournament..." 
                      className="pl-12 md:pl-16 h-12 md:h-16 bg-muted/10 border-none rounded-xl md:rounded-2xl font-bold text-lg md:text-xl shadow-inner focus:ring-4 focus:ring-primary/10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-3 md:space-y-4">
                  <Label className="text-[10px] md:text-[11px] font-black text-muted-foreground uppercase tracking-widest px-1">Format</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="h-12 md:h-16 bg-muted/10 border-none rounded-xl md:rounded-2xl font-bold text-base md:text-lg shadow-inner">
                      <SelectValue placeholder="All Formats" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-none shadow-2xl z-50">
                      <SelectItem value="all" className="font-bold">All Formats</SelectItem>
                      <SelectItem value="Singles" className="font-bold">Singles</SelectItem>
                      <SelectItem value="Doubles" className="font-bold">Doubles</SelectItem>
                      <SelectItem value="Mixed Doubles" className="font-bold">Mixed Doubles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 md:space-y-4">
                  <Label className="text-[10px] md:text-[11px] font-black text-muted-foreground uppercase tracking-widest px-1">Competition</Label>
                  <Select value={filterCompetition} onValueChange={setFilterCompetition}>
                    <SelectTrigger className="h-12 md:h-16 bg-muted/10 border-none rounded-xl md:rounded-2xl font-bold text-base md:text-lg shadow-inner">
                      <SelectValue placeholder="All Events" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-none shadow-2xl z-50">
                      <SelectItem value="all" className="font-bold">All Events</SelectItem>
                      {uniqueCompetitions.map(comp => (
                        <SelectItem key={comp} value={comp!} className="font-bold">{comp}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {hasFilters && (
                <div className="flex justify-end pt-2 md:pt-6">
                  <Button variant="ghost" size="lg" onClick={clearFilters} className="text-primary font-black hover:bg-primary/5 rounded-full px-6 md:px-10 py-4 md:py-6 text-xs md:text-sm tracking-widest uppercase">
                    <X className="h-4 w-4 md:h-5 md:w-5 mr-2 md:mr-3" />
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-12 md:space-y-20 pb-48">
            {viewMode === 'list' ? (
              <MatchTable title="Performance Registry" matches={filteredMatches} />
            ) : (
              Object.entries(groupedByCompetition).map(([comp, compMatches]) => (
                <MatchTable 
                  key={comp} 
                  title={comp} 
                  matches={compMatches} 
                  icon={<Trophy className="h-6 w-6 md:h-10 md:w-10 text-primary" />} 
                />
              ))
            )}

            {filteredMatches.length === 0 && (
              <div className="text-center py-32 md:py-64 bg-white rounded-[2rem] md:rounded-[4rem] border-4 border-dashed shadow-sm flex flex-col items-center justify-center space-y-6 md:space-y-10">
                <div className="bg-muted/10 p-8 md:p-12 rounded-full">
                  <Activity className="h-12 w-12 md:h-24 md:w-24 text-muted-foreground opacity-20" />
                </div>
                <p className="text-muted-foreground font-black text-lg md:text-2xl tracking-tight px-6 md:px-12">No results matching your tactical criteria.</p>
                <Button onClick={clearFilters} variant="outline" className="rounded-full px-10 md:px-14 h-12 md:h-16 font-black uppercase text-xs md:text-sm tracking-[0.2em] border-2">Reset Analytics</Button>
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
    </>
  );
}

function MatchTable({ title, matches, icon }: { title: string, matches: BadmintonMatch[], icon?: React.ReactNode }) {
  if (matches.length === 0) return null;

  return (
    <Card className="shadow-2xl shadow-black/5 border-none overflow-hidden rounded-[2rem] md:rounded-[4rem] bg-white transition-all">
      <CardHeader className="bg-muted/5 p-6 md:p-16 flex flex-row items-center gap-4 md:gap-8 border-b border-muted/30">
        <div className="bg-white p-3 md:p-5 rounded-xl md:rounded-2xl shadow-xl shadow-black/5">
          {icon || <ListIcon className="h-6 w-6 md:h-10 md:w-10 text-primary" />}
        </div>
        <CardTitle className="text-xl md:text-5xl font-black tracking-tighter">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto w-full">
          <Table className="min-w-[700px] md:min-w-full">
            <TableHeader>
              <TableRow className="bg-muted/10 border-none">
                <TableHead className="w-[180px] md:w-[280px] font-black uppercase text-[11px] md:text-[13px] tracking-[0.3em] pl-6 md:pl-16 h-16 md:h-24">Timeline</TableHead>
                <TableHead className="font-black uppercase text-[11px] md:text-[13px] tracking-[0.3em] h-16 md:h-24">Roster Matchup</TableHead>
                <TableHead className="font-black uppercase text-[11px] md:text-[13px] tracking-[0.3em] h-16 md:h-24">Final Tally</TableHead>
                <TableHead className="text-right font-black uppercase text-[11px] md:text-[13px] tracking-[0.3em] pr-6 md:pr-16 h-16 md:h-24">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((match) => (
                <TableRow key={match.id} className="hover:bg-muted/5 transition-all border-muted/30">
                  <TableCell className="pl-6 md:pl-16 py-6 md:py-10">
                    <div className="flex flex-col">
                      <span className="font-black text-sm md:text-2xl tracking-tighter">{new Date(match.matchDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <div className="flex items-center text-[9px] md:text-[11px] font-black text-muted-foreground mt-1.5 md:mt-3 uppercase tracking-[0.1em]">
                        <Clock className="h-2.5 w-2.5 md:h-3.5 md:w-3.5 mr-1.5 md:mr-2 text-primary/60" />
                        {new Date(match.matchDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 md:py-10">
                    <div className="flex flex-col gap-2 md:gap-4">
                      <div className="flex flex-col gap-1 md:gap-2 text-sm md:text-xl">
                        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                          <span className="font-black text-primary tracking-tight">{match.myName}</span>
                          {match.partner && (
                            <span className="text-muted-foreground text-[10px] md:text-base font-bold">& {match.partner}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                          <span className="font-black tracking-tight">{match.opponent}</span>
                          {match.opponentPartner && (
                            <span className="text-muted-foreground text-[10px] md:text-base font-bold">& {match.opponentPartner}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 md:py-10">
                    <div className="flex gap-2 md:gap-3">
                      {match.myScore.map((s, i) => (
                        <span key={i} className={`text-[10px] md:text-base px-3 md:px-5 py-1.5 md:py-2.5 rounded-lg md:rounded-2xl font-mono font-black shadow-lg border ${s > match.opponentScore[i] ? 'bg-primary text-white border-primary shadow-primary/20' : 'bg-muted/50 text-muted-foreground border-transparent'}`}>
                          {s}-{match.opponentScore[i]}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6 md:pr-16 py-6 md:py-10">
                    <Badge variant={match.result === 'Win' ? 'secondary' : 'destructive'} className="shadow-xl md:shadow-2xl shadow-black/5 px-4 md:px-8 py-2 md:py-3 font-black uppercase text-[10px] md:text-[12px] tracking-[0.2em] rounded-xl md:rounded-2xl border-none">
                      {match.result === 'Win' ? 'VICTORY' : 'DEFEAT'}
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