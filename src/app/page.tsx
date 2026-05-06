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
  ArrowUpRight,
  UserPlus,
  Zap,
  Swords,
  Heart
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
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground animate-pulse font-black uppercase tracking-widest">Syncing Pro Stats...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-white/80 backdrop-blur-md px-4 md:px-6 sticky top-0 z-20 shadow-sm w-full">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <div className="flex flex-col">
              <h1 className="text-base md:text-lg font-black tracking-tight text-foreground uppercase leading-none">Court Intel</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60 mt-1 hidden xs:block">{user.displayName || 'Elite Player'}</p>
            </div>
          </div>
          <Button asChild className="gap-2 shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all rounded-full px-4 md:px-6 h-9 md:h-10 font-black uppercase text-[10px] md:text-xs tracking-widest">
            <Link href="/matches/new">
              <Plus className="h-4 w-4" />
              <span className="hidden xs:inline">Record Match</span>
              <span className="xs:hidden">Record</span>
            </Link>
          </Button>
        </header>

        <main className="flex-1 space-y-6 md:space-y-10 p-4 md:p-10 max-w-full mx-auto w-full">
          <div className="relative w-full h-[280px] md:h-[350px] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl bg-primary animate-in fade-in duration-1000">
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
            <div className="absolute inset-0 bg-gradient-to-tr from-primary via-primary/60 to-transparent flex flex-col justify-center px-6 md:px-16">
              <Badge className="w-fit mb-4 md:mb-6 bg-white/10 hover:bg-white/20 text-white backdrop-blur-xl border-white/20 px-3 py-1 font-black uppercase tracking-[0.2em] text-[9px] md:text-[10px]" variant="outline">
                {matches.length === 0 ? 'ROOKIE STATUS' : 'ELITE COMPETITOR'}
              </Badge>
              <h2 className="text-3xl md:text-6xl font-black tracking-tighter text-white mb-2 md:mb-4 drop-shadow-2xl leading-tight">
                {matches.length === 0 ? "Dominate the Court" : "Smash the Limits"}
              </h2>
              <p className="max-w-xl text-white/90 text-sm md:text-lg leading-tight mb-6 md:mb-8 font-bold tracking-tight opacity-90">
                {matches.length === 0 
                  ? "Track every shuttlecock, analyze every set, and climb the rankings."
                  : `Conquered ${matches.length} matches with a ${stats.winRatio}% win rate.`}
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="rounded-xl h-12 md:h-14 px-6 md:px-10 shadow-xl bg-white text-primary hover:bg-white/90 font-black text-sm md:text-base border-none transition-all hover:scale-105 active:scale-95 group">
                   <Link href="/matches/new" className="flex items-center">
                    New Victory <ArrowUpRight className="ml-2 h-4 md:h-5 w-4 md:w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                   </Link>
                </Button>
              </div>
            </div>
          </div>

          {matches.length > 0 ? (
            <>
              <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
                {[
                  { icon: Zap, title: "Best Ally", value: stats.bestAlly, color: "text-secondary", bgColor: "bg-secondary/10", subtitle: "Most wins" },
                  { icon: UserPlus, title: "Frequent", value: stats.frequentPartner, color: "text-primary", bgColor: "bg-primary/10", subtitle: "Most sessions" },
                  { icon: Swords, title: "Nemesis", value: stats.nemesis, color: "text-destructive", bgColor: "bg-destructive/10", subtitle: "Hardest beat" },
                  { icon: Heart, title: "Fav Rival", value: stats.favoriteRival, color: "text-secondary", bgColor: "bg-secondary/10", subtitle: "Most wins vs" }
                ].map((stat, i) => (
                  <Card key={i} className="border-none shadow-xl shadow-black/5 hover:translate-y-[-2px] transition-all duration-300 rounded-[1.5rem] md:rounded-[2rem] bg-white overflow-hidden group">
                    <CardHeader className="pb-1 px-4 pt-4 md:px-6 md:pt-6">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-muted-foreground flex items-center gap-1 md:gap-2">
                          <stat.icon className={`h-2.5 w-2.5 md:h-3 md:w-3 ${stat.color}`} /> {stat.title}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
                      <div className="text-sm md:text-lg font-black tracking-tighter truncate">{stat.value}</div>
                      <p className="text-[8px] md:text-[9px] mt-0.5 font-black uppercase tracking-widest text-muted-foreground/50">{stat.subtitle}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-5">
                <Card className="lg:col-span-2 border-none shadow-2xl shadow-black/5 flex flex-col overflow-hidden bg-white rounded-[2rem] md:rounded-[2.5rem]">
                  <CardHeader className="border-b bg-muted/5 p-6 md:p-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 md:gap-4">
                        <Calendar className="h-4 w-4 md:h-5 md:w-5 text-secondary" />
                        <div>
                          <CardTitle className="text-lg md:text-xl font-black tracking-tight uppercase">Recent Action</CardTitle>
                          <CardDescription className="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-60">Last 5 Matches</CardDescription>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild className="h-7 md:h-8 px-3 md:px-4 text-primary hover:bg-primary/5 font-black uppercase text-[8px] md:text-[9px] tracking-widest rounded-full">
                        <Link href="/history">See All</Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-0">
                    <div className="divide-y divide-muted/30">
                      {recentMatches.map((match) => (
                        <div key={match.id} className="flex items-center justify-between p-4 md:p-6 hover:bg-muted/10 transition-all group">
                          <div className="flex items-center gap-3 md:gap-5 min-w-0">
                            <div className={`h-10 w-10 md:h-12 md:w-12 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shrink-0 ${match.result === 'Win' ? 'bg-secondary text-white shadow-secondary/20' : 'bg-destructive text-white shadow-destructive/20'}`}>
                              {match.result === 'Win' ? <Trophy className="h-4 w-4 md:h-6 md:w-6" /> : <Frown className="h-4 w-4 md:h-6 md:w-6" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1 min-w-0">
                                  <p className="text-xs md:text-sm font-black group-hover:text-primary transition-colors tracking-tight truncate">{match.opponent}</p>
                                  {match.opponentPartner && <span className="text-[9px] md:text-[10px] text-muted-foreground font-bold ml-1 truncate">/ {match.opponentPartner}</span>}
                                </div>
                                <div className="flex items-center text-[9px] md:text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5 truncate">
                                  <MapPin className="h-2.5 w-2.5 mr-1 text-primary/60" /> {match.location}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <Badge variant={match.result === 'Win' ? 'secondary' : 'destructive'} className="text-[7px] md:text-[8px] px-1.5 py-0 md:px-2 md:py-0.5 font-black uppercase tracking-widest">
                              {match.result}
                            </Badge>
                            <p className="text-[10px] md:text-sm mt-1 font-mono font-black text-foreground/70 tracking-tighter">
                              {match.myScore.join('-')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-3 border-none shadow-2xl shadow-black/5 flex flex-col overflow-hidden bg-white rounded-[2rem] md:rounded-[2.5rem]">
                  <CardHeader className="border-b bg-muted/5 p-6 md:p-8">
                    <div className="flex items-center gap-4">
                      <LayoutGrid className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg md:text-xl font-black tracking-tight uppercase">Win Distribution</CardTitle>
                        <CardDescription className="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-60">Victory Metrics</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-4 md:p-8 flex items-center justify-center min-h-[250px] md:min-h-[300px]">
                    <ChartContainer config={chartConfig} className="w-full h-full min-h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: '900', letterSpacing: '0.1em' }} />
                          <YAxis hide />
                          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                          <Bar dataKey="value" radius={[8, 8, 4, 4]} barSize={40}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} className="drop-shadow-xl" />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4 pb-6">
                {[
                  { icon: Activity, title: "Archive", value: stats.totalMatches, color: "primary", subtitle: "Total Games" },
                  { icon: Target, title: "Efficiency", value: `${stats.winRatio}%`, color: "secondary", subtitle: "Win Rate" },
                  { icon: Trophy, title: "Victories", value: stats.wins, color: "primary", invert: true, subtitle: "Games Won" },
                  { icon: Frown, title: "Defeats", value: stats.losses, color: "destructive", subtitle: "Games Lost" }
                ].map((stat, i) => (
                  <Card key={i} className={`border-none shadow-xl shadow-black/5 hover:translate-y-[-2px] transition-all duration-300 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden ${stat.invert ? 'bg-primary text-primary-foreground' : 'bg-white'}`}>
                    <CardHeader className="pb-1 px-4 pt-4 md:px-6 md:pt-6">
                      <CardTitle className={`text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] flex items-center gap-1.5 ${stat.invert ? 'opacity-70' : 'text-muted-foreground'}`}>
                        <stat.icon className={`h-2.5 w-2.5 md:h-3 md:w-3 ${stat.invert ? '' : `text-${stat.color}`}`} /> {stat.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
                      <div className="text-2xl md:text-3xl font-black tracking-tighter">{stat.value}</div>
                      <p className={`text-[8px] md:text-[9px] mt-0.5 font-black uppercase tracking-widest ${stat.invert ? 'opacity-50' : 'text-muted-foreground/50'}`}>{stat.subtitle}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mt-6 md:mt-10">
              {[
                { icon: Target, title: "Precision", desc: "Log every point to visualize your technical consistency." },
                { icon: Trophy, title: "Tournaments", desc: "Group matches by event to track your championship trajectory." },
                { icon: TrendingUp, title: "Analytics", desc: "Unlock professional trends and automated data visualizations." }
              ].map((feature, i) => (
                <Card key={i} className="border-none shadow-2xl shadow-black/5 p-6 md:p-8 bg-white rounded-[2rem] md:rounded-[2.5rem]">
                  <CardContent className="p-0">
                    <div className="h-12 w-12 md:h-16 md:w-16 rounded-[1.2rem] md:rounded-[1.5rem] bg-primary/10 flex items-center justify-center mb-6 md:mb-8">
                      <feature.icon className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                    </div>
                    <h3 className="font-black text-xl md:text-2xl mb-2 md:mb-3 tracking-tighter uppercase">{feature.title}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-bold opacity-70">{feature.desc}</p>
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
