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
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-white/80 backdrop-blur-md px-6 sticky top-0 z-20 shadow-sm w-full">
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

        <main className="flex-1 space-y-6 md:space-y-8 p-4 md:p-8 w-full">
          <div className="relative w-full h-[240px] md:h-[300px] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-2xl bg-primary">
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
            <div className="absolute inset-0 bg-gradient-to-tr from-primary via-primary/60 to-transparent flex flex-col justify-center px-6 md:px-12">
              <Badge className="w-fit mb-3 bg-white/10 text-white border-white/20 px-3 py-1 font-black uppercase tracking-widest text-[9px]" variant="outline">
                {matches.length === 0 ? 'ROOKIE STATUS' : 'ELITE COMPETITOR'}
              </Badge>
              <h2 className="text-2xl md:text-5xl font-black tracking-tighter text-white mb-2 md:mb-4 drop-shadow-2xl">
                {matches.length === 0 ? "Dominate the Court" : "Smash the Limits"}
              </h2>
              <p className="max-w-xl text-white/90 text-xs md:text-base leading-tight mb-4 md:mb-6 font-bold tracking-tight">
                {matches.length === 0 
                  ? "Track every shuttlecock and analyze every set to climb the rankings."
                  : `Conquered ${matches.length} matches with a ${stats.winRatio}% win rate.`}
              </p>
              <div className="flex gap-4">
                <Button asChild size="sm" className="rounded-xl h-10 md:h-12 px-6 shadow-xl bg-white text-primary hover:bg-white/90 font-black text-xs md:text-sm border-none group">
                   <Link href="/matches/new" className="flex items-center">
                    New Victory <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                   </Link>
                </Button>
              </div>
            </div>
          </div>

          {matches.length > 0 ? (
            <>
              <div className="grid gap-4 md:gap-4 grid-cols-2 lg:grid-cols-4">
                {[
                  { icon: Zap, title: "Best Ally", value: stats.bestAlly, color: "text-secondary", subtitle: "Most wins" },
                  { icon: UserPlus, title: "Frequent", value: stats.frequentPartner, color: "text-primary", subtitle: "Most sessions" },
                  { icon: Swords, title: "Nemesis", value: stats.nemesis, color: "text-destructive", subtitle: "Hardest beat" },
                  { icon: Heart, title: "Fav Rival", value: stats.favoriteRival, color: "text-secondary", subtitle: "Most wins vs" }
                ].map((stat, i) => (
                  <Card key={i} className="border-none shadow-xl shadow-black/5 rounded-[1.2rem] md:rounded-[1.5rem] bg-white overflow-hidden">
                    <CardHeader className="pb-1 px-4 pt-4">
                      <CardTitle className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <stat.icon className={`h-2.5 w-2.5 ${stat.color}`} /> {stat.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="text-xs md:text-sm font-black tracking-tighter truncate">{stat.value}</div>
                      <p className="text-[7px] md:text-[8px] mt-0.5 font-black uppercase text-muted-foreground/50">{stat.subtitle}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-6 grid-cols-1 lg:grid-cols-5">
                <Card className="lg:col-span-2 border-none shadow-2xl shadow-black/5 bg-white rounded-[1.5rem] md:rounded-[2rem] overflow-hidden">
                  <CardHeader className="border-b bg-muted/5 p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-secondary" />
                        <div>
                          <CardTitle className="text-sm md:text-base font-black uppercase tracking-tight">Recent Action</CardTitle>
                          <CardDescription className="text-[8px] font-black uppercase tracking-widest opacity-60">Last 5 Matches</CardDescription>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild className="h-7 px-3 text-primary font-black uppercase text-[8px] tracking-widest rounded-full">
                        <Link href="/history">See All</Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-muted/30">
                      {recentMatches.map((match) => (
                        <div key={match.id} className="flex items-center justify-between p-3 md:p-4 hover:bg-muted/10 transition-all group">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`h-8 w-8 md:h-10 md:w-10 rounded-lg flex items-center justify-center shadow-lg shrink-0 ${match.result === 'Win' ? 'bg-secondary text-white' : 'bg-destructive text-white'}`}>
                              {match.result === 'Win' ? <Trophy className="h-4 w-4" /> : <Frown className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] md:text-xs font-black truncate">{match.opponent}</p>
                              <div className="flex items-center text-[8px] text-muted-foreground uppercase font-black tracking-widest truncate mt-0.5">
                                <Clock className="h-2 w-2 mr-1" /> {new Date(match.matchDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[10px] md:text-xs font-mono font-black text-foreground/70">
                              {match.myScore.join('-')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-3 border-none shadow-2xl shadow-black/5 bg-white rounded-[1.5rem] md:rounded-[2rem] overflow-hidden">
                  <CardHeader className="border-b bg-muted/5 p-4 md:p-6">
                    <div className="flex items-center gap-3">
                      <LayoutGrid className="h-4 w-4 text-primary" />
                      <div>
                        <CardTitle className="text-sm md:text-base font-black uppercase tracking-tight">Win Distribution</CardTitle>
                        <CardDescription className="text-[8px] font-black uppercase tracking-widest opacity-60">Victory Metrics</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 flex items-center justify-center min-h-[200px] md:min-h-[250px]">
                    <ChartContainer config={chartConfig} className="w-full h-full min-h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: '900', letterSpacing: '0.1em' }} />
                          <YAxis hide />
                          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                          <Bar dataKey="value" radius={[6, 6, 2, 2]} barSize={32}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} className="drop-shadow-lg" />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:gap-4 grid-cols-2 lg:grid-cols-4 pb-10">
                {[
                  { icon: Activity, title: "Archive", value: stats.totalMatches, color: "primary", subtitle: "Total Games" },
                  { icon: Target, title: "Efficiency", value: `${stats.winRatio}%`, color: "secondary", subtitle: "Win Rate" },
                  { icon: Trophy, title: "Victories", value: stats.wins, color: "primary", invert: true, subtitle: "Games Won" },
                  { icon: Frown, title: "Defeats", value: stats.losses, color: "destructive", subtitle: "Games Lost" }
                ].map((stat, i) => (
                  <Card key={i} className={`border-none shadow-xl shadow-black/5 rounded-[1.2rem] md:rounded-[1.5rem] overflow-hidden ${stat.invert ? 'bg-primary text-primary-foreground' : 'bg-white'}`}>
                    <CardHeader className="pb-1 px-4 pt-4">
                      <CardTitle className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${stat.invert ? 'opacity-70' : 'text-muted-foreground'}`}>
                        <stat.icon className={`h-2.5 w-2.5 ${stat.invert ? '' : `text-${stat.color}`}`} /> {stat.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="text-xl md:text-2xl font-black tracking-tighter">{stat.value}</div>
                      <p className={`text-[7px] md:text-[8px] mt-0.5 font-black uppercase ${stat.invert ? 'opacity-50' : 'text-muted-foreground/50'}`}>{stat.subtitle}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
              {[
                { icon: Target, title: "Precision", desc: "Log every point to visualize your technical consistency." },
                { icon: Trophy, title: "Tournaments", desc: "Group matches by event to track your championship trajectory." },
                { icon: TrendingUp, title: "Analytics", desc: "Unlock professional trends and automated data visualizations." }
              ].map((feature, i) => (
                <Card key={i} className="border-none shadow-2xl shadow-black/5 p-6 bg-white rounded-[1.5rem] md:rounded-[2rem]">
                  <CardContent className="p-0">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                    </div>
                    <h3 className="font-black text-base md:text-lg mb-1 tracking-tighter uppercase">{feature.title}</h3>
                    <p className="text-[10px] md:text-xs text-muted-foreground leading-relaxed font-bold opacity-70">{feature.desc}</p>
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
