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
  MapPin,
  ChevronRight
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
import { collection, query, orderBy, where } from 'firebase/firestore';
import placeholderData from '@/app/lib/placeholder-images.json';

export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const heroImage = placeholderData.placeholderImages.find(img => img.id === 'badminton-hero');

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

  if (isUserLoading || (user && matchesLoading)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground animate-pulse font-medium">Loading your stats...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const allMatches = matches || [];
  const stats = MatchService.calculateStats(allMatches);
  const recentMatches = allMatches.slice(0, 5);

  const chartData = [
    { name: 'Wins', value: stats.wins, fill: 'hsl(var(--secondary))' },
    { name: 'Losses', value: stats.losses, fill: 'hsl(var(--destructive))' },
  ];

  const config = {
    wins: { label: "Wins", color: "hsl(var(--secondary))" },
    losses: { label: "Losses", color: "hsl(var(--destructive))" },
  };

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-white px-6 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-foreground">Performance Dashboard</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Player: {user.displayName || user.email?.split('@')[0]}</p>
            </div>
          </div>
          <Button asChild variant="default" className="gap-2 shadow-md bg-primary hover:bg-primary/90 transition-all">
            <Link href="/matches/new">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Match</span>
            </Link>
          </Button>
        </header>

        <main className="flex-1 space-y-8 p-6 lg:p-10">
          <div className="relative w-full h-[280px] md:h-[350px] rounded-3xl overflow-hidden border border-white shadow-2xl bg-primary">
            {heroImage && (
              <Image 
                src={heroImage.imageUrl} 
                alt={heroImage.description} 
                fill 
                className="object-cover opacity-30 mix-blend-overlay"
                data-ai-hint={heroImage.imageHint}
                priority
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent flex flex-col justify-center px-8 md:px-16">
              <Badge className="w-fit mb-4 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border-white/20" variant="outline">
                {allMatches.length === 0 ? 'GETTING STARTED' : 'PLAYER PERFORMANCE'}
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
                {allMatches.length === 0 ? "Welcome to the Court!" : `Keep Smashed, ${user.displayName?.split(' ')[0] || 'Player'}!`}
              </h2>
              <p className="max-w-md text-white/80 text-lg leading-relaxed mb-8">
                {allMatches.length === 0 
                  ? "Track your wins, losses, and tournament progress all in one place. Your journey to the top starts here."
                  : `You've played ${allMatches.length} matches so far. Your win rate is currently sitting at ${stats.winRatio}%.`}
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="rounded-full px-10 shadow-xl bg-white text-primary hover:bg-white/90 font-bold border-none transition-transform hover:scale-105">
                   <Link href="/matches/new">{allMatches.length === 0 ? 'Record First Match' : 'Add New Result'}</Link>
                </Button>
                {allMatches.length > 0 && (
                  <Button variant="outline" asChild size="lg" className="rounded-full px-10 bg-white/10 text-white border-white/30 backdrop-blur-md hover:bg-white/20 transition-transform hover:scale-105">
                     <Link href="/history">View History</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {allMatches.length > 0 && (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-sm hover:shadow-md transition-all">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                      <Activity className="h-3 w-3" /> Total Matches
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-black">{stats.totalMatches}</div>
                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">All competition types</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm hover:shadow-md transition-all">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                      <Target className="h-3 w-3" /> Win Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-black text-secondary">{stats.winRatio}%</div>
                    <div className="h-2 w-full bg-muted rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-secondary transition-all duration-1000 ease-out" style={{ width: `${stats.winRatio}%` }} />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm hover:shadow-md transition-all bg-primary text-primary-foreground">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase opacity-80 tracking-widest flex items-center gap-2">
                      <Trophy className="h-3 w-3" /> Victories
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-black">{stats.wins}</div>
                    <p className="text-[10px] opacity-70 mt-1 font-medium">Keep winning streaks alive!</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm hover:shadow-md transition-all">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                      <Frown className="h-3 w-3" /> Losses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-black text-destructive">{stats.losses}</div>
                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">Review and adapt</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-8 lg:grid-cols-3">
                <Card className="lg:col-span-2 border-none shadow-sm flex flex-col overflow-hidden">
                  <CardHeader className="border-b bg-muted/20">
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4 text-primary" />
                      <div>
                        <CardTitle className="text-lg font-bold">Performance Breakdown</CardTitle>
                        <CardDescription>Visual stats of your match outcomes</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-8 flex items-center justify-center min-h-[350px]">
                    <ChartContainer config={config} className="w-full max-w-lg">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold' }} />
                          <YAxis hide />
                          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={80}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm flex flex-col overflow-hidden">
                  <CardHeader className="border-b bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <CardTitle className="text-lg font-bold">Recent Action</CardTitle>
                      </div>
                      <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-primary hover:bg-primary/5 font-bold">
                        <Link href="/history">View All</Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-0 overflow-auto">
                    <div className="divide-y">
                      {recentMatches.map((match) => (
                        <div key={match.id} className="flex items-center justify-between p-5 hover:bg-muted/30 transition-colors group">
                          <div className="flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${match.result === 'Win' ? 'bg-secondary/10 text-secondary' : 'bg-destructive/10 text-destructive'}`}>
                              {match.result === 'Win' ? <Trophy className="h-5 w-5" /> : <Frown className="h-5 w-5" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold group-hover:text-primary transition-colors">vs {match.opponent}</p>
                              <div className="flex items-center text-[10px] text-muted-foreground uppercase font-bold mt-0.5">
                                <MapPin className="h-2.5 w-2.5 mr-1" /> {match.location}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={match.result === 'Win' ? 'secondary' : 'destructive'} className="text-[10px] px-2 py-0 font-bold uppercase">
                              {match.result}
                            </Badge>
                            <p className="text-[10px] mt-1.5 font-mono font-bold text-muted-foreground">
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

          {allMatches.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {[
                { icon: Target, title: "Track Accuracy", desc: "Log every point scored and conceded to see your shot consistency and identify patterns." },
                { icon: Trophy, title: "Win Tournaments", desc: "Group matches by competition to track your path to the podium and view tournament progress." },
                { icon: TrendingUp, title: "Visual Trends", desc: "Get professional insights into your performance through automated win-loss data visualizations." }
              ].map((feature, i) => (
                <Card key={i} className="border-none shadow-sm hover:shadow-lg transition-all p-4 bg-white">
                  <CardContent className="pt-6">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
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