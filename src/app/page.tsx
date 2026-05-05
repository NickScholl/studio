
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
  Plus
} from 'lucide-react';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';

export default function Dashboard() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

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
      <div className="flex h-screen items-center justify-center bg-background">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const stats = MatchService.calculateStats(matches);
  const recentMatches = matches.slice(0, 5);

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
            <h1 className="text-lg font-headline font-semibold">Performance Dashboard</h1>
          </div>
          <Button asChild variant="default" size="sm" className="gap-2">
            <Link href="/matches/new">
              <Plus className="h-4 w-4" />
              New Match
            </Link>
          </Button>
        </header>

        <main className="flex-1 space-y-8 p-6 lg:p-10">
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

          <div className="grid gap-6 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Win/Loss Comparison</CardTitle>
                <CardDescription>Visual breakdown of your match outcomes.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {stats.totalMatches > 0 ? (
                  <ChartContainer config={config}>
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" />
                      <YAxis hide />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <Activity className="h-10 w-10 mb-2 opacity-20" />
                    <p>No matches recorded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your last 5 match results.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentMatches.length > 0 ? (
                    recentMatches.map((match) => (
                      <div key={match.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${match.result === 'Win' ? 'bg-secondary/10 text-secondary' : 'bg-destructive/10 text-destructive'}`}>
                            {match.result === 'Win' ? <Trophy className="h-4 w-4" /> : <Frown className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium">vs {match.opponent}</p>
                            <p className="text-xs text-muted-foreground">{new Date(match.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${match.result === 'Win' ? 'text-secondary' : 'text-destructive'}`}>
                            {match.result}
                          </p>
                          <p className="text-xs text-muted-foreground">{match.type}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent matches found.
                    </div>
                  )}
                </div>
                {recentMatches.length > 0 && (
                  <Button asChild variant="link" className="w-full mt-4">
                    <Link href="/history">View all match history</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </div>
  );
}
