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
  Plus,
  Sparkles,
  ChevronRight,
  BrainCircuit
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
import { collection, query, orderBy } from 'firebase/firestore';
import { analyzePerformance, type AnalyzePerformanceOutput } from '@/ai/flows/analyze-performance';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const [aiAnalysis, setAiAnalysis] = React.useState<AnalyzePerformanceOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

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

  async function handleGetAiInsights() {
    if (!matches || matches.length === 0) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzePerformance({
        playerName: user?.displayName || 'Player',
        matches: matches.map(m => ({
          date: m.date,
          type: m.type,
          opponent: m.opponent,
          result: m.result,
          myScore: m.myScore,
          opponentScore: m.opponentScore,
          notes: m.notes,
        })),
      });
      setAiAnalysis(result);
    } catch (error) {
      console.error('AI Analysis failed', error);
    } finally {
      setIsAnalyzing(false);
    }
  }

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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>AI Performance Insights</CardTitle>
                  <CardDescription>Get expert analysis based on your history.</CardDescription>
                </div>
                <Button 
                  onClick={handleGetAiInsights} 
                  disabled={isAnalyzing || matches.length === 0}
                  variant="outline"
                  className="gap-2 border-primary/20 hover:border-primary/50"
                >
                  {isAnalyzing ? <Activity className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
                  {aiAnalysis ? "Refresh Analysis" : "Analyze My Game"}
                </Button>
              </CardHeader>
              <CardContent>
                {isAnalyzing ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-32 w-full" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  </div>
                ) : aiAnalysis ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                      <p className="text-sm leading-relaxed italic text-muted-foreground">
                        "{aiAnalysis.analysis}"
                      </p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
                          <Trophy className="h-4 w-4" /> Strengths
                        </h4>
                        <ul className="space-y-2">
                          {aiAnalysis.strengths.map((s, i) => (
                            <li key={i} className="text-xs flex items-start gap-2">
                              <ChevronRight className="h-3 w-3 mt-0.5 text-secondary" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2">
                          <Target className="h-4 w-4" /> Focus Areas
                        </h4>
                        <ul className="space-y-2">
                          {aiAnalysis.weaknesses.map((w, i) => (
                            <li key={i} className="text-xs flex items-start gap-2">
                              <ChevronRight className="h-3 w-3 mt-0.5 text-accent" />
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4 text-primary" /> Training Plan
                      </h4>
                      <div className="grid gap-2">
                        {aiAnalysis.recommendations.map((r, i) => (
                          <div key={i} className="text-xs bg-muted/30 p-2 rounded border border-border/50">
                            {r}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                    <Sparkles className="h-12 w-12 mb-4 opacity-10" />
                    <p className="text-sm">Click the button above for an AI coaching session.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="lg:col-span-3 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Win/Loss Ratio</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                  {stats.totalMatches > 0 ? (
                    <ChartContainer config={config}>
                      <BarChart data={chartData}>
                        <XAxis dataKey="name" hide />
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
                      <Activity className="h-8 w-8 mb-2 opacity-20" />
                      <p className="text-xs">No data yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentMatches.length > 0 ? (
                      recentMatches.map((match) => (
                        <div key={match.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-transparent hover:border-border transition-all">
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-full ${match.result === 'Win' ? 'bg-secondary/10 text-secondary' : 'bg-destructive/10 text-destructive'}`}>
                              {match.result === 'Win' ? <Trophy className="h-3 w-3" /> : <Frown className="h-3 w-3" />}
                            </div>
                            <div>
                              <p className="text-xs font-medium">vs {match.opponent}</p>
                              <p className="text-[10px] text-muted-foreground">{new Date(match.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Badge variant={match.result === 'Win' ? 'secondary' : 'destructive'} className="text-[9px] px-1.5 py-0">
                            {match.result}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-xs text-muted-foreground">
                        No recent matches.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </SidebarInset>
    </div>
  );
}
