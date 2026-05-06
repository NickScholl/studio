
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
  Loader2,
  Calendar,
  LayoutGrid,
  MapPin
} from 'lucide-react';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, Cell, ResponsiveContainer } from "recharts";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import placeholderData from '@/app/lib/placeholder-images.json';

export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const heroImage = placeholderData.placeholderImages.find(img => img.id === 'badminton-hero');

  const matchesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    // We remove the orderBy here to avoid mandatory composite index errors
    return query(
      collection(db, 'matches'),
      where('participantUserIds', 'array-contains', user.uid)
    );
  }, [db, user]);

  const { data: rawMatches, isLoading: matchesLoading } = useCollection<BadmintonMatch>(matchesQuery);

  // Sort matches in-memory to ensure they show up even without composite indexes
  const matches = React.useMemo(() => {
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

  if (isUserLoading || (user && matchesLoading)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground animate-pulse font-medium">Syncing court data...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const stats = MatchService.calculateStats(matches);
  const recentMatches = matches.slice(0, 5);

  const chartData = [
    { name: 'Wins', value: stats.wins, fill: 'hsl(var(--secondary))' },
    { name: 'Losses', value: stats.losses, fill: 'hsl(var(--destructive))' },
  ];

  const config = {
    wins: { label: "Wins", color: "hsl(var(--secondary))" },
    losses: { label: "Losses", color: "hsl(var(--destructive))" },
  };

  return (
    <div className="flex min-h-screen bg-[#f0f2f5]">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-white/80 backdrop-blur-md px-6 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-foreground">Performance Dashboard</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Player: {user.displayName || user.email?.split('@')[0]}</p>
            </div>
          </div>
          <Button asChild variant="default" className="gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all rounded-full px-6">
            <Link href="/matches/new">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Match</span>
            </Link>
          </Button>
        </header>

        <main className="flex-1 space-y-8 p-6 lg:p-10">
          <div className="relative w-full h-[320px] md:h-[400px] rounded-[2rem] overflow-hidden shadow-2xl bg-primary">
            {heroImage && (
              <Image 
                src={heroImage.imageUrl} 
                alt={heroImage.description} 
                fill 
                className="object-cover opacity-20 mix-blend-overlay"
                data-ai-hint={heroImage.imageHint}
                priority
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary via-primary/60 to-transparent flex flex-col justify-center px-10 md:px-20">
              <Badge className="w-fit mb-6 bg-white/10 hover:bg-white/20 text-white backdrop-blur-xl border-white/20 px-4 py-1" variant="outline">
                {matches.length === 0 ? 'READY FOR ACTION' : 'ELITE PERFORMANCE'}
              </Badge>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6 drop-shadow-md">
                {matches.length === 0 ? "Begin Your Legacy" : `Smash It, ${user.displayName?.split(' ')[0] || 'Champ'}!`}
              </h2>
              <p className="max-w-xl text-white/90 text-xl leading-relaxed mb-10 font-medium">
                {matches.length === 0 
                  ? "Transform your game. Track every point, analyze every set, and climb the rankings."
                  : `Total domination. You've conquered ${matches.length} matches. Keep that ${stats.winRatio}% win rate soaring.`}
              </p>
              <div className="flex flex-wrap gap-5">
                <Button asChild size="lg" className="rounded-full h-14 px-12 shadow-2xl bg-white text-primary hover:bg-white/90 font-black text-lg border-none transition-transform hover:scale-105 active:scale-95">
                   <Link href="/matches/new">{matches.length === 0 ? 'First Match' : 'New Victory'}</Link>
                </Button>
                {matches.length > 0 && (
                  <Button variant="outline" asChild size="lg" className="rounded-full h-14 px-12 bg-white/5 text-white border-white/40 backdrop-blur-xl hover:bg-white/10 transition-transform hover:scale-105 active:scale-95">
                     <Link href="/history">Full History</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {matches.length > 0 && (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-xl shadow-black/5 hover:translate-y-[-4px] transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                      <Activity className="h-3 w-3 text-primary" /> Total Matches
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-5xl font-black tracking-tighter">{stats.totalMatches}</div>
                    <p className="text-[11px] text-muted-foreground mt-2 font-bold uppercase">Matches tracked</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-xl shadow-black/5 hover:translate-y-[-4px] transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                      <Target className="h-3 w-3 text-secondary" /> Win Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-5xl font-black tracking-tighter text-secondary">{stats.winRatio}%</div>
                    <div className="h-2 w-full bg-muted rounded-full mt-4 overflow-hidden">
                      <div className="h-full bg-secondary transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(var(--secondary),0.5)]" style={{ width: `${stats.winRatio}%` }} />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-xl shadow-primary/20 bg-primary text-primary-foreground hover:translate-y-[-4px] transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase opacity-80 tracking-widest flex items-center gap-2">
                      <Trophy className="h-3 w-3" /> Victories
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-5xl font-black tracking-tighter">{stats.wins}</div>
                    <p className="text-[11px] opacity-70 mt-2 font-bold uppercase">Games won</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-xl shadow-black/5 hover:translate-y-[-4px] transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                      <Frown className="h-3 w-3 text-destructive" /> Losses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-5xl font-black tracking-tighter text-destructive">{stats.losses}</div>
                    <p className="text-[11px] text-muted-foreground mt-2 font-bold uppercase">Learning moments</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-8 lg:grid-cols-3">
                <Card className="lg:col-span-2 border-none shadow-2xl shadow-black/5 flex flex-col overflow-hidden bg-white">
                  <CardHeader className="border-b bg-muted/5 p-8">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-2xl">
                        <LayoutGrid className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-black tracking-tight">Performance Breakdown</CardTitle>
                        <CardDescription className="text-xs font-bold uppercase tracking-wider">Visual analytics</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-8 flex items-center justify-center min-h-[400px]">
                    <ChartContainer config={config} className="w-full max-w-xl">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: '900' }} />
                          <YAxis hide />
                          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                          <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={90}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} className="filter drop-shadow-lg" />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-2xl shadow-black/5 flex flex-col overflow-hidden bg-white">
                  <CardHeader className="border-b bg-muted/5 p-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-secondary/10 rounded-2xl">
                          <Calendar className="h-5 w-5 text-secondary" />
                        </div>
                        <CardTitle className="text-xl font-black tracking-tight">Recent Action</CardTitle>
                      </div>
                      <Button variant="ghost" size="sm" asChild className="h-10 px-4 text-primary hover:bg-primary/5 font-black uppercase text-xs tracking-widest">
                        <Link href="/history">View All</Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-0">
                    <div className="divide-y">
                      {recentMatches.map((match) => (
                        <div key={match.id} className="flex items-center justify-between p-6 hover:bg-muted/30 transition-all group cursor-default">
                          <div className="flex items-center gap-5">
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform ${match.result === 'Win' ? 'bg-secondary text-white' : 'bg-destructive text-white'}`}>
                              {match.result === 'Win' ? <Trophy className="h-6 w-6" /> : <Frown className="h-6 w-6" />}
                            </div>
                            <div>
                              <p className="text-base font-black group-hover:text-primary transition-colors">vs {match.opponent}</p>
                              <div className="flex items-center text-[11px] text-muted-foreground uppercase font-black tracking-tighter mt-1">
                                <MapPin className="h-3 w-3 mr-1 text-primary/60" /> {match.location}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={match.result === 'Win' ? 'secondary' : 'destructive'} className="text-[10px] px-3 py-1 font-black uppercase tracking-widest">
                              {match.result}
                            </Badge>
                            <p className="text-sm mt-2 font-mono font-black text-foreground/80">
                              {match.myScore.join('-')} / {match.opponentScore.join('-')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {matches.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {[
                { icon: Target, title: "Track Accuracy", desc: "Log every point scored and conceded to see your shot consistency and identify patterns." },
                { icon: Trophy, title: "Win Tournaments", desc: "Group matches by competition to track your path to the podium and view tournament progress." },
                { icon: TrendingUp, title: "Visual Trends", desc: "Get professional insights into your performance through automated win-loss data visualizations." }
              ].map((feature, i) => (
                <Card key={i} className="border-none shadow-xl shadow-black/5 hover:scale-[1.02] transition-all p-6 bg-white rounded-[2rem]">
                  <CardContent className="pt-6">
                    <div className="h-16 w-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center mb-8">
                      <feature.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-black text-2xl mb-3 tracking-tight">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </SidebarInset>
    </div>
  );
}
