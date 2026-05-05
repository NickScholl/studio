
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BadmintonMatch, MatchService } from '@/lib/match-service';
import { 
  Trophy, 
  Frown, 
  Target, 
  TrendingUp,
  Activity,
  Plus,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import placeholderData from '@/app/lib/placeholder-images.json';

export default function Dashboard() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const heroImage = placeholderData.placeholderImages.find(img => img.id === 'badminton-hero');

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

  if (authLoading || matchesLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If we're not loading but have no user, show a simple transition screen while redirecting
  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  const stats = MatchService.calculateStats(matches);
  const recentMatches = matches.slice(0, 8);

  const chartData = [
    { name: 'Wins', value: stats.wins, fill: 'hsl(var(--primary))' },
    { name: 'Losses', value: stats.losses, fill: 'hsl(var(--accent))' },
  ];

  const config = {
    wins: { label: "Wins", color: "hsl(var(--primary))" },
    losses: { label: "Losses", color: "hsl(var(--accent))" },
  };

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-lg font-semibold">Performance Dashboard</h1>
          </div>
          <Button asChild variant="default" size="sm" className="gap-2">
            <Link href="/matches/new">
              <Plus className="h-4 w-4" />
              New Match
            </Link>
          </Button>
        </header>

        <main className="flex-1 space-y-8 p-6 lg:p-10">
          {matches.length === 0 && heroImage && (
            <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden mb-8 border border-border shadow-sm">
              <Image 
                src={heroImage.imageUrl} 
                alt={heroImage.description} 
                fill 
                className="object-cover opacity-60"
                data-ai-hint={heroImage.imageHint}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-transparent flex flex-col justify-center px-8">
                <h2 className="text-3xl font-bold">Welcome, {user.displayName?.split(' ')[0] || 'Player'}!</h2>
                <p className="max-w-md mt-2 text-muted-foreground">Ready to track your first win? Record your match stats and see your performance grow.</p>
                <Button asChild className="w-fit mt-4" variant="default">
                   <Link href="/matches/new">Start Tracking</Link>
                </Button>
              </div>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Matches Played</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalMatches}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Win Ratio</CardTitle>
                <TrendingUp className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.winRatio}%</div>
                <div className="h-2 w-full bg-muted rounded-full mt-2">
                  <div 
                    className="h-full bg-secondary rounded-full" 
                    style={{ width: `${stats.winRatio}%` }} 
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Wins</CardTitle>
                <Trophy className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.wins}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Losses</CardTitle>
                <Frown className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.losses}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Win/Loss Comparison</CardTitle>
                <CardDescription>Visual breakdown of your overall performance.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 min-h-[300px] flex items-center justify-center">
                {stats.totalMatches > 0 ? (
                  <ChartContainer config={config} className="w-full max-w-md">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Activity className="h-12 w-12 mb-4 opacity-10" />
                    <p className="text-sm text-center">No match data available yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Activity</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/history" className="text-xs flex items-center gap-1">
                      View All <ChevronRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                <div className="space-y-4">
                  {recentMatches.length > 0 ? (
                    recentMatches.map((match) => (
                      <div key={match.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-transparent hover:border-border transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${match.result === 'Win' ? 'bg-secondary/10 text-secondary' : 'bg-destructive/10 text-destructive'}`}>
                            {match.result === 'Win' ? <Trophy className="h-4 w-4" /> : <Frown className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">vs {match.opponent}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{new Date(match.date).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{match.location}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={match.result === 'Win' ? 'secondary' : 'destructive'} className="px-2 py-0">
                            {match.result}
                          </Badge>
                          <div className="text-[10px] mt-1 font-mono text-muted-foreground">
                            {match.myScore.join('-')}/{match.opponentScore.join('-')}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 text-muted-foreground">
                      <Target className="h-10 w-10 mx-auto mb-4 opacity-20" />
                      <p className="text-sm">No recent matches found.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </div>
  );
}
