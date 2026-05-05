
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
import { collection, query, orderBy, where } from 'firebase/firestore';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MatchHistory() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterType, setFilterType] = React.useState<string>('all');
  const [filterResult, setFilterResult] = React.useState<string>('all');
  const [filterPlace, setFilterPlace] = React.useState<string>('all');
  const [filterCompetition, setFilterCompetition] = React.useState<string>('all');
  const [viewMode, setViewMode] = React.useState<'list' | 'competition'>('list');

  const matchesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'matches'),
      where('participantUserIds', 'array-contains', user.uid),
      orderBy('matchDate', 'desc')
    );
  }, [db, user]);

  const { data: matches, isLoading: matchesLoading } = useCollection<BadmintonMatch>(matchesQuery);

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const allMatches = matches || [];

  const uniqueLocations = React.useMemo(() => {
    const locations = allMatches.map(m => m.location).filter(Boolean);
    return Array.from(new Set(locations)).sort();
  }, [allMatches]);

  const uniqueCompetitions = React.useMemo(() => {
    const competitions = allMatches.map(m => m.competitionName).filter(Boolean);
    return Array.from(new Set(competitions)).sort();
  }, [allMatches]);

  const filteredMatches = React.useMemo(() => {
    return allMatches.filter(m => {
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
      const matchesPlace = filterPlace === 'all' || m.location === filterPlace;
      const matchesCompetition = filterCompetition === 'all' || m.competitionName === filterCompetition;

      return matchesSearch && matchesType && matchesResult && matchesPlace && matchesCompetition;
    });
  }, [allMatches, searchTerm, filterType, filterResult, filterPlace, filterCompetition]);

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
    setFilterPlace('all');
    setFilterCompetition('all');
  };

  const hasFilters = searchTerm !== '' || 
                     filterType !== 'all' || 
                     filterResult !== 'all' || 
                     filterPlace !== 'all' ||
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
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-lg font-bold">Match History</h1>
          </div>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="hidden sm:block">
            <TabsList>
              <TabsTrigger value="list" className="gap-2">
                <ListIcon className="h-4 w-4" /> List View
              </TabsTrigger>
              <TabsTrigger value="competition" className="gap-2">
                <Trophy className="h-4 w-4" /> Groups
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </header>

        <main className="p-6 lg:p-10 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Filter className="h-4 w-4" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider">Search & Filters</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Player / Competition</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search names..." 
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Match Type</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Singles">Singles</SelectItem>
                      <SelectItem value="Doubles">Doubles</SelectItem>
                      <SelectItem value="Mixed Doubles">Mixed Doubles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Competition</Label>
                  <Select value={filterCompetition} onValueChange={setFilterCompetition}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Competitions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Competitions</SelectItem>
                      {uniqueCompetitions.map(comp => (
                        <SelectItem key={comp} value={comp!}>{comp}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {hasFilters && (
                <div className="flex justify-end pt-2">
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-primary hover:text-primary/80">
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            {viewMode === 'list' ? (
              <MatchTable title="All Matches" matches={filteredMatches} />
            ) : (
              Object.entries(groupedByCompetition).map(([comp, compMatches]) => (
                <MatchTable 
                  key={comp} 
                  title={comp} 
                  matches={compMatches} 
                  icon={<Trophy className="h-5 w-5 text-primary" />} 
                />
              ))
            )}

            {filteredMatches.length === 0 && (
              <div className="text-center py-20 bg-white rounded-lg border border-dashed">
                <Activity className="h-10 w-10 mx-auto mb-4 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground">No matches found matching your search.</p>
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
    <Card className="shadow-sm border-none overflow-hidden">
      <CardHeader className="bg-primary/5 pb-4 flex flex-row items-center gap-2">
        {icon}
        <CardTitle className="text-lg font-bold">{title} ({matches.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20">
                <TableHead className="w-[140px] font-bold">Date & Venue</TableHead>
                <TableHead className="font-bold">Matchup</TableHead>
                <TableHead className="font-bold">Score</TableHead>
                <TableHead className="text-right font-bold">Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((match) => (
                <TableRow key={match.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{new Date(match.matchDate).toLocaleDateString()}</span>
                      <div className="flex items-center text-[11px] text-muted-foreground mt-0.5">
                        <MapPin className="h-2.5 w-2.5 mr-1" />
                        {match.location}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[10px] h-4 py-0 font-normal">
                          {match.matchType}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-bold text-primary">{match.myName}</span>
                        {match.partner && <span className="text-muted-foreground text-xs">& {match.partner}</span>}
                        <Swords className="h-3 w-3 mx-1 text-muted-foreground" />
                        <span className="font-medium">{match.opponent}</span>
                        {match.opponentPartner && <span className="text-muted-foreground text-xs">& {match.opponentPartner}</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {match.myScore.map((s, i) => (
                        <span key={i} className={`text-xs px-1.5 py-0.5 rounded font-mono ${s > match.opponentScore[i] ? 'bg-primary/10 text-primary font-bold' : 'bg-muted text-muted-foreground'}`}>
                          {s}-{match.opponentScore[i]}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={match.result === 'Win' ? 'secondary' : 'destructive'} className="shadow-none">
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
