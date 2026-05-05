
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
import { Search, MapPin, Users, Swords, X, Calendar as CalendarIcon, Filter, Activity } from 'lucide-react';
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
import { useUser, useFirestore, useCollection } from '@/firebase';
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

  const matchesQuery = React.useMemo(() => {
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

  const uniqueLocations = React.useMemo(() => {
    const locations = matches.map(m => m.location).filter(Boolean);
    return Array.from(new Set(locations)).sort();
  }, [matches]);

  const filteredMatches = React.useMemo(() => {
    return matches.filter(m => {
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
      const matchTime = new Date(m.date).getTime();
      const start = filterStartDate ? new Date(filterStartDate).getTime() : -Infinity;
      const end = filterEndDate ? new Date(filterEndDate).getTime() : Infinity;
      const matchesDate = matchTime >= start && matchTime <= end;

      return matchesSearch && matchesType && matchesResult && matchesPlace && matchesDate;
    });
  }, [matches, searchTerm, filterType, filterResult, filterPlace, filterStartDate, filterEndDate]);

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
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2 w-full">
                <Label className="text-xs uppercase text-muted-foreground font-bold">Search Players</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by name or partner..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground font-bold">Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Match Type" />
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
                <Label className="text-xs uppercase text-muted-foreground font-bold">Result</Label>
                <Select value={filterResult} onValueChange={setFilterResult}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Win">Win</SelectItem>
                    <SelectItem value="Loss">Loss</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground font-bold">Venue</Label>
                <Select value={filterPlace} onValueChange={setFilterPlace}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Select Venue" />
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

            <div className="flex flex-col md:flex-row gap-4 items-end bg-muted/30 p-4 rounded-lg border">
              <div className="grid grid-cols-2 gap-4 flex-1 w-full">
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground font-bold flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" /> From Date
                  </Label>
                  <Input 
                    type="date" 
                    value={filterStartDate} 
                    onChange={(e) => setFilterStartDate(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground font-bold flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" /> To Date
                  </Label>
                  <Input 
                    type="date" 
                    value={filterEndDate} 
                    onChange={(e) => setFilterEndDate(e.target.value)} 
                  />
                </div>
              </div>

              {hasFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="text-muted-foreground h-10">
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              )}
            </div>
          </div>

          <Card>
            <CardHeader className="pb-2 border-b">
              <CardTitle className="text-xl">Match Records ({filteredMatches.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredMatches.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[150px]">Date & Venue</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Matchup</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead className="text-right">Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMatches.map((match) => (
                      <TableRow key={match.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{new Date(match.date).toLocaleDateString()}</span>
                            <div className="flex items-center text-[10px] text-muted-foreground">
                              <MapPin className="h-2.5 w-2.5 mr-1" />
                              {match.location}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{match.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-primary">{match.myName}</span>
                            {match.partner && <span className="text-muted-foreground">& {match.partner}</span>}
                            <Swords className="h-3 w-3 mx-1 opacity-50" />
                            <span>{match.opponent}</span>
                            {match.opponentPartner && <span className="text-muted-foreground">& {match.opponentPartner}</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {match.myScore.map((s, i) => (
                              <span key={i} className="text-[10px] bg-muted px-1 rounded">{s}-{match.opponentScore[i]}</span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={match.result === 'Win' ? 'secondary' : 'destructive'}>
                            {match.result}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-20">
                  <Activity className="h-10 w-10 mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground">No matches found matching your filters.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </div>
  );
}
