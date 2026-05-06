
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
  ArrowUpRight,
  UserPlus,
  Zap,
  Swords,
  Heart,
  Clock
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
    return query(
      collection(db, 'matches'),
      where('participantUserIds', 'array-contains', user.uid)
    );
  }, [db, user]);

  const { data: rawMatches, isLoading: matchesLoading } = useCollection<BadmintonMatch>(matchesQuery);

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

  const stats = React.useMemo(() => MatchService.calculateStats(matches), [matches]);
  const recentMatches = React.useMemo(() => matches.slice(0, 5), [matches]);

  const chartData = React.useMemo(() => [
    { name: 'Wins', value: stats.wins, fill: 'hsl(var(--secondary))' },
    { name: 'Losses', value: stats.losses, fill: 'hsl(var(--destructive))' },
  ], [stats]);

  const chartConfig = {
    wins: { label: "Wins", color: "hsl(var(--secondary))" },
    losses: { label: "Losses", color: "hsl(var(--destructive))" },
  };

  if (isUserLoading || (user && matchesLoading)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <AppSidebar />
      <SidebarInset className="flex flex-col flex-1 min-w-0 bg-[#f8f9fc] overflow-x-hidden">
        <header className="flex h-16 md:h-20 shrink-0 items-center justify-between gap-4 border-b bg-white/95 backdrop-blur-xl px-4 md:px-8 sticky top-0 z-50 shadow-sm w-full">
          <div className="flex items-center gap-3 md:gap-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex flex-col">
              <h1 className="text-lg md:text-xl font-black tracking-tight text-foreground uppercase">Tactical Intel</h1>
              <p className="text-[10px] text-muted-foreground uppercase font-bold hidden sm:block">Logged as {user.displayName || 'Player'}</p>
            </div>
          </div>
          <Button asChild size="sm" className="md:size-default shadow-lg shadow-primary/20 rounded-full px-4 md:px-6">
            <Link href="/matches/new">
              <Plus className="h-4 w-4 mr-2" />
              <span>Record Action</span>
            </Link>
          </Button>
        </header>

        <main className="flex-1 p-4 md:p-8 space-y-6 md:space-y-10 w-full max-w-7xl mx-auto pb-24">
          <div className="relative w-full h-[200px] md:h-[350px] rounded-2xl md:rounded-[2rem] overflow-hidden shadow-xl bg-primary">
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
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent flex flex-col justify-end p-6 md:p-12">
              <Badge className="w-fit mb-3 bg-white/20 text-white border-white/30" variant="outline">
                {matches.length === 0 ? 'NEW ROSTER' : 'ELITE COMPETITOR'}
              </Badge>
              <h2 className="text-2xl md:text-5xl font-black tracking-tighter text-white mb-2 leading-none">
                {matches.length === 0 ? "Dominate the Court" : "Smash the Limits"}
              </h2>
              <p className="max-w-xl text-white/90 text-sm md:text-lg leading-relaxed font-medium opacity-90">
                {matches.length === 0 
                  ? "Track every shuttlecock and analyze tactical patterns to climb the rankings."
                  : `Archived ${matches.length} matches with a professional ${stats.winRatio}% win efficiency.`}
              </p>
            </div>
          </div>

          {matches.length > 0 ? (
            <>
              <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
                {[
                  { icon: Zap, title: "Best Ally", value: stats.bestAlly, color: "text-secondary" },
                  { icon: UserPlus, title: "Frequent", value: stats.frequentPartner, color: "text-primary" },
                  { icon: Swords, title: "Nemesis", value: stats.nemesis, color: "text-destructive" },
                  { icon: Heart, title: "Fav Rival", value: stats.favoriteRival, color: "text-secondary" }
                ].map((stat, i) => (
                  <Card key={i} className="border-none shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden transition-all hover:shadow-md">
                    <CardHeader className="p-4 pb-0">
                      <CardTitle className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <stat.icon className={`h-3 w-3 md:h-4 md:w-4 ${stat.color}`} /> {stat.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="text-sm md:text-lg font-black truncate">{stat.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-5">
                <Card className="lg:col-span-2 border-none shadow-sm bg-white rounded-xl md:rounded-2xl">
                  <CardHeader className="border-b bg-muted/5 p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm md:text-lg font-black uppercase tracking-tight">Timeline Action</CardTitle>
                      <Button variant="ghost" size="sm" asChild className="text-xs font-bold text-primary hover:bg-primary/5">
                        <Link href="/history">View All</Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-muted/10">
                      {recentMatches.map((match) => (
                        <div key={match.id} className="flex items-center justify-between p-4 hover:bg-muted/5 transition-all">
                          <div className="flex items-center gap-4">
                            <div className={`h-8 w-8 md:h-10 md:w-10 rounded-lg flex items-center justify-center shadow-sm ${match.result === 'Win' ? 'bg-secondary text-white' : 'bg-destructive text-white'}`}>
                              {match.result === 'Win' ? <Trophy className="h-4 w-4" /> : <Frown className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate">{match.opponent}</p>
                              <p className="text-[10px] text-muted-foreground font-medium">{new Date(match.matchDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <p className="text-xs md:text-sm font-mono font-black">{match.myScore.join('-')}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-3 border-none shadow-sm bg-white rounded-xl md:rounded-2xl">
                  <CardHeader className="border-b bg-muted/5 p-4 md:p-6">
                    <CardTitle className="text-sm md:text-lg font-black uppercase tracking-tight">Victory Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-8 flex items-center justify-center min-h-[300px]">
                    <ChartContainer config={chartConfig} className="w-full h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold' }} />
                          <YAxis hide />
                          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4 pb-12">
                {[
                  { icon: Activity, title: "Sessions", value: stats.totalMatches, color: "primary" },
                  { icon: Target, title: "Efficiency", value: `${stats.winRatio}%`, color: "secondary" },
                  { icon: Trophy, title: "Victories", value: stats.wins, color: "secondary" },
                  { icon: Frown, title: "Defeats", value: stats.losses, color: "destructive" }
                ].map((stat, i) => (
                  <Card key={i} className="border-none shadow-sm rounded-xl md:rounded-3xl bg-white overflow-hidden">
                    <CardContent className="p-6 text-center">
                      <div className="bg-muted/5 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <stat.icon className={`h-5 w-5 text-${stat.color}`} />
                      </div>
                      <div className="text-2xl md:text-4xl font-black tracking-tight">{stat.value}</div>
                      <p className="text-[10px] md:text-xs font-bold uppercase text-muted-foreground mt-1">{stat.title}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              {[
                { icon: Target, title: "Precision Tracking", desc: "Log every point to visualize your elite consistency and tactical growth." },
                { icon: Trophy, title: "Event Grouping", desc: "Group matches by tournament to track your professional trajectory." },
                { icon: TrendingUp, title: "Elite Analytics", desc: "Unlock tactical trends and automated visualizations for your game." }
              ].map((feature, i) => (
                <Card key={i} className="border-none shadow-sm p-8 bg-white rounded-2xl">
                  <CardContent className="p-0 text-center">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 mx-auto">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-black text-lg mb-2 tracking-tight uppercase">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </SidebarInset>
    </>
  );
}
