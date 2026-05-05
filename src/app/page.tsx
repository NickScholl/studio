
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
  Loader2,
  Calendar,
  LayoutGrid
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
          <p className="text-sm text-muted-foreground animate-pulse">Loading your court stats...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const allMatches = matches || [];
  const stats = MatchService.calculateStats(allMatches);
  const recentMatches = allMatches.slice(0, 5);

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
      <SidebarInset className="bg-background/50">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-white px-6 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <div className="flex flex-col">
              <h1 className="text-lg font-bold leading-none">Shuttle Dashboard</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Player: {user.displayName || user.email?.split('@')[0]}</p>
            </div>
          </div>
          <Button asChild variant="default" size="sm" className="gap-2 shadow-sm">
            <Link href="/matches/new">
              <Plus className="h-4 w-4" />
              New Match
            </Link>
          </Button>
        </header>

        <main className="flex-1 space-y-8 p-6 lg:p-10">
          {allMatches.length === 0 ? (
            <div className="grid gap-6">
              <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden border border-border shadow-xl bg-primary/5">
                {heroImage && (
                  <Image 
                    src={heroImage.imageUrl} 
                    alt={heroImage.description} 
                    fill 
                    className="object-cover opacity-20"
                    data-ai-hint={heroImage.imageHint}
                  />
                )}
                <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-12">
                  <Badge className="w-fit mb-4" variant="secondary">GETTING STARTED</Badge>
                  <h2 className="text-4xl font-black tracking-tight text-primary">Welcome to the court!</h2>
                  <p className="max-w-md mt-4 text-lg text-muted-foreground leading-relaxed">
                    You haven't recorded any matches yet. Track your wins, losses, and tournament progress all in one place.
                  </p>
                  <div className="flex flex-wrap gap-4 mt-8">
                    <Button asChild size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20">
                       <Link href="/matches/new">Record First Match</Link>
                    </Button>
                    <Button variant="outline" asChild size="lg" className="rounded-full px-8 bg-white/50 backdrop-blur-sm">
                       <Link href="/settings">Setup Profile</Link>
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: Target, title: "Track Accuracy", desc: "Log every point scored and conceded to see your shot consistency." },
                  { icon: Trophy, title: "Win Tournaments", desc: "Group matches by competition to track your path to the podium." },
                  { icon: TrendingUp, title: "AI Analysis", desc: "Get professional technical feedback on your playstyle trends." }
                ].map((feature, i) => (
                  <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-bold mb-1">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-sm overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Activity className="h-12 w-12" />
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Total Played</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black">{stats.totalMatches}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">Across all match types</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Win Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black text-secondary">{stats.winRatio}%</div>
                    <div className="h-1.5 w-full bg-muted rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-full bg-secondary transition-all duration-1000 ease-out" 
                        style={{ width: `${stats.winRatio}%` }} 
                      />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-primary text-primary-foreground">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase opacity-70 tracking-widest text-white">Victories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black">{stats.wins}</div>
                    <p className="text-[10px] opacity-70 mt-1">Nice work, keep smashing!</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Defeats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black text-accent">{stats.losses}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">Room for improvement</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 border-none shadow-sm flex flex-col">
                  <CardHeader className="border-b bg-muted/5">
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4 text-primary" />
                      <div>
                        <CardTitle className="text-lg">Performance Breakdown</CardTitle>
                        <CardDescription>Wins vs Losses visual data</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-6 flex items-center justify-center min-h-[300px]">
                    <ChartContainer config={config} className="w-full max-w-lg">
                      <BarChart data={chartData}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={60}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm flex flex-col">
                  <CardHeader className="border-b bg-muted/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <CardTitle className="text-lg">Recent Action</CardTitle>
                      </div>
                      <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-primary">
                        <Link href="/history" className="text-xs font-bold">
                          View All
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-0 overflow-auto">
                    <div className="divide-y">
                      {recentMatches.map((match) => (
                        <div key={match.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${match.result === 'Win' ? 'bg-secondary/10 text-secondary' : 'bg-destructive/10 text-destructive'}`}>
                              {match.result === 'Win' ? <Trophy className="h-4 w-4" /> : <Frown className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold">vs {match.opponent}</p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{match.location}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={match.result === 'Win' ? 'secondary' : 'destructive'} className="text-[10px] py-0">
                              {match.result}
                            </Badge>
                            <p className="text-[10px] mt-1 font-mono text-muted-foreground">
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
        </main>
      </SidebarInset>
    </div>
  );
}
