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
import { Search, MapPin, Swords, X, Calendar as CalendarIcon, Activity, Filter } from 'lucide-react';
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
import { collection, query, orderBy } from 'firebase/firestore';

export default function MatchHistory() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterType, setFilterType] = React.useState<string>('all');
  const [filterResult, setFilterResult] = React.useState<string>('all');
  const [filterPlace, setFilterPlace] = React.useState<string>('all');
  const [filterStartDate, setFilterStartDate] = React.useState<string>('');
  const [filterEndDate, setFilterEndDate] = React.useState<string>('');

  const matchesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'matches'),
      orderBy('date', 'desc')
    );
  }, [db, user]);

  const { data: matches, loading: matchesLoading } = useCollection<BadmintonMatch>(matchesQuery);

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const allMatches = matches || [];

  const uniqueLocations = React.useMemo(() => {
    const locations = allMatches.map(m => m.location).filter(Boolean);
    return Array.from(new Set(locations)).sort();
  }, [allMatches]);

  const filteredMatches = React.useMemo(() => {
    return allMatches.filter(m => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || (
        m.myName.toLowerCase().includes(search) ||
        m.opponent.toLowerCase().includes(search) ||
        (m.partner && m.partner.toLowerCase().includes(search)) ||
        (m.opponentPartner && m.opponentPartner.toLowerCase().includes(search))
      );
      const matchesType = filterType === 'all' || m.type === filterType;
      const matchesResult = filterResult === 'all' || m.result === filterResult;
      const matchesPlace = filterPlace === 'all' || m.location === filterPlace;
      
      const matchesDate = (!filterStartDate || m.date >= filterStartDate) && 
                          (!filterEndDate || m.date <= filterEndDate);

      return matchesSearch && matchesType && matchesResult && matchesPlace && matchesDate;
    });
  }, [allMatches, searchTerm, filterType, filterResult, filterPlace, filterStartDate, filterEndDate]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterResult('all');
    setFilterPlace('all');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const hasFilters = searchTerm !== '' || 
                     filterType !== 'all' || 
                     filterResult !== 'all' || 
                     filterPlace !== 'all' || 
                     filterStartDate !== '' || 
                     filterEndDate !== '';

  if (authLoading || matchesLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-lg font-headline font-semibold">Match History</h1>
          </div>
        </header>

        <main className="p-6 lg:p-10 space-y-6">
          <Card className="border-none shadow-md bg-white">
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Filter className="h-4 w-4" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider">Search & Filters</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground">PLAYER/OPPONENT</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search names..." 
                      className="pl-10 h-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground">MATCH TYPE</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="h-10">
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
                  <Label className="text-xs font-bold text-muted-foreground">RESULT</Label>
                  <Select value={filterResult} onValueChange={setFilterResult}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="All Results" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Results</SelectItem>
                      <SelectItem value="Win">Win</SelectItem>
                      <SelectItem value="Loss">Loss</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground">VENUE</Label>
                  <Select value={filterPlace} onValueChange={setFilterPlace}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="All Venues" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Venues</SelectItem>
                      {uniqueLocations.map(loc => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" /> FROM DATE
                  </Label>
                  <Input 
                    type="date" 
                    className="h-10"
                    value={filterStartDate} 
                    onChange={(e) => setFilterStartDate(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" /> TO DATE
                  </Label>
                  <Input 
                    type="date" 
                    className="h-10"
                    value={filterEndDate} 
                    onChange={(e) => setFilterEndDate(e.target.value)} 
                  />
                </div>
                <div className="flex items-end">
                  {hasFilters && (
                    <Button variant="outline" size="sm" onClick={clearFilters} className="text-muted-foreground h-10 w-full md:w-auto">
                      <X className="h-4 w-4 mr-2" />
                      Reset All
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none overflow-hidden">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-xl font-bold">Matches Log ({filteredMatches.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredMatches.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-[150px] font-bold">Date & Venue</TableHead>
                      <TableHead className="font-bold">Matchup</TableHead>
                      <TableHead className="font-bold">Score</TableHead>
                      <TableHead className="text-right font-bold">Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMatches.map((match) => (
                      <TableRow key={match.id} className="hover:bg-muted/10 transition-colors">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">{new Date(match.date).toLocaleDateString()}</span>
                            <div className="flex items-center text-[11px] text-muted-foreground mt-0.5">
                              <MapPin className="h-2.5 w-2.5 mr-1 text-primary" />
                              {match.location}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] h-4 px-1 font-normal opacity-70">
                                {match.type}
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
                          <div className="flex gap-1.5 flex-wrap">
                            {match.myScore.map((s, i) => (
                              <span key={i} className={`text-xs px-2 py-0.5 rounded font-mono ${s > match.opponentScore[i] ? 'bg-primary/10 text-primary font-bold' : 'bg-muted text-muted-foreground'}`}>
                                {s}-{match.opponentScore[i]}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={match.result === 'Win' ? 'secondary' : 'destructive'} className="shadow-sm">
                            {match.result}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-24">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-10 text-primary" />
                  <p className="text-muted-foreground font-medium">No matches match your criteria.</p>
                  <Button variant="link" onClick={clearFilters} className="mt-2 text-primary">
                    Clear all filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </div>
  );
}
