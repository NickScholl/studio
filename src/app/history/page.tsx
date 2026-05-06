
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
import { Search, MapPin, Swords, X, Activity, Filter, Trophy, List as ListIcon } from 'lucide-react';
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
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-white/80 backdrop-blur-md px-6 sticky top-0 z-20 shadow-sm w-full">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-lg font-black tracking-tight">Match History</h1>
          </div>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="hidden sm:block">
            <TabsList className="bg-muted/50 rounded-full p-1">
              <TabsTrigger value="list" className="gap-2 rounded-full font-bold px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <ListIcon className="h-3.5 w-3.5" /> List
              </TabsTrigger>
              <TabsTrigger value="competition" className="gap-2 rounded-full font-bold px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Trophy className="h-3.5 w-3.5" /> Groups
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </header>

        <main className="p-6 lg:p-10 space-y-8 max-w-full mx-auto w-full">
          <Card className="border-none shadow-xl shadow-black/5 bg-white rounded-3xl overflow-hidden">
            <CardHeader className="pb-4 border-b border-muted/50 bg-muted/10 px-8">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Filter className="h-4 w-4" />
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em]">Filters</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-8 px-8 pb-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Search Players</Label>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                      placeholder="Name..." 
                      className="pl-12 h-12 bg-muted/10 border-none focus-visible:ring-primary rounded-xl"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Match Type</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="h-12 bg-muted/10 border-none rounded-xl focus:ring-primary">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-none shadow-2xl z-[100] opacity-100">
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Singles">Singles</SelectItem>
                      <SelectItem value="Doubles">Doubles</SelectItem>
                      <SelectItem value="Mixed Doubles">Mixed Doubles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Competition</Label>
                  <Select value={filterCompetition} onValueChange={setFilterCompetition}>
                    <SelectTrigger className="h-12 bg-muted/10 border-none rounded-xl focus:ring-primary">
                      <SelectValue placeholder="All Events" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-none shadow-2xl z-[100] opacity-100">
                      <SelectItem value="all">All Events</SelectItem>
                      {uniqueCompetitions.map(comp => (
                        <SelectItem key={comp} value={comp!}>{comp}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {hasFilters && (
                <div className="flex justify-end pt-2">
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-primary font-bold hover:bg-primary/5 rounded-full px-4">
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-10">
            {viewMode === 'list' ? (
              <MatchTable title="All Matches" matches={filteredMatches} />
            ) : (
              Object.entries(groupedByCompetition).map(([comp, compMatches]) => (
                <MatchTable 
                  key={comp} 
                  title={comp} 
                  matches={compMatches} 
                  icon={<Trophy className="h-6 w-6 text-primary" />} 
                />
              ))
            )}

            {filteredMatches.length === 0 && (
              <div className="text-center py-32 bg-white rounded-[2rem] border-2 border-dashed shadow-sm">
                <Activity className="h-16 w-16 mx-auto mb-6 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground font-bold tracking-tight">No matches found for these filters.</p>
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
    </div>
  );
}

function MatchTable({ title, matches, icon }: { title: string, matches: BadmintonMatch[], icon?: React.ReactNode }) {
  if (matches.length === 0) return null;

  return (
    <Card className="shadow-2xl shadow-black/5 border-none overflow-hidden rounded-[2rem] bg-white">
      <CardHeader className="bg-muted/5 pb-6 pt-8 px-8 flex flex-row items-center gap-3 border-b border-muted/50">
        {icon}
        <CardTitle className="text-2xl font-black tracking-tighter">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/10 border-none">
                <TableHead className="w-[180px] font-black uppercase text-[10px] tracking-widest pl-8 h-14">Date & Venue</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest h-14">Matchup</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest h-14">Score</TableHead>
                <TableHead className="text-right font-black uppercase text-[10px] tracking-widest pr-8 h-14">Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((match) => (
                <TableRow key={match.id} className="hover:bg-muted/10 transition-colors border-muted/50">
                  <TableCell className="pl-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-black text-base tracking-tight">{new Date(match.matchDate).toLocaleDateString()}</span>
                      <div className="flex items-center text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-tighter">
                        <MapPin className="h-3 w-3 mr-1 text-primary/50" />
                        {match.location}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-6">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[9px] h-4 py-0 font-black uppercase border-primary/20 bg-primary/5 text-primary tracking-widest">
                          {match.matchType}
                        </Badge>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-primary text-base">{match.myName}</span>
                          {match.partner && (
                            <>
                              <span className="text-muted-foreground/50 font-light">&</span>
                              <span className="font-bold text-muted-foreground text-sm">{match.partner}</span>
                            </>
                          )}
                        </div>
                        <Swords className="h-4 w-4 mx-2 text-muted-foreground/30 hidden md:block" />
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-base">{match.opponent}</span>
                          {match.opponentPartner && (
                            <>
                              <span className="text-muted-foreground/50 font-light">&</span>
                              <span className="font-bold text-muted-foreground text-sm">{match.opponentPartner}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-6">
                    <div className="flex gap-2">
                      {match.myScore.map((s, i) => (
                        <span key={i} className={`text-xs px-2.5 py-1 rounded-lg font-mono tracking-tighter shadow-sm ${s > match.opponentScore[i] ? 'bg-primary text-white font-black' : 'bg-muted text-muted-foreground font-bold'}`}>
                          {s}-{match.opponentScore[i]}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8 py-6">
                    <Badge variant={match.result === 'Win' ? 'secondary' : 'destructive'} className="shadow-xl shadow-black/5 px-4 py-1.5 font-black uppercase text-[10px] tracking-widest">
                      {match.result}
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
