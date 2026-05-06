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
        <div className="text-center space-y-6">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-lg text-muted-foreground animate-pulse font-black uppercase tracking-widest">Syncing Pro Stats...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[#f8f9fc] w-full overflow-x-hidden">
      <AppSidebar />
      <SidebarInset className="flex flex-col flex-1 min-w-0">
        <header className="flex h-20 md:h-28 shrink-0 items-center justify-between gap-4 border-b bg-white/95 backdrop-blur-xl px-4 md:px-12 sticky top-0 z-50 shadow-sm w-full">
          <div className="flex items-center gap-4 md:gap-8">
            <SidebarTrigger className="-ml-1 h-10 w-10 md:h-16 md:w-16" />
            <div className="flex flex-col">
              <h1 className="text-lg md:text-4xl font-black tracking-tighter text-foreground uppercase leading-none">Court Intel</h1>
              <p className="text-[8px] md:text-[12px] text-muted-foreground uppercase tracking-[0.3em] font-black mt-1 hidden xs:block">{user.displayName || 'Elite Player'}</p>
            </div>
          </div>
          <Button asChild size="lg" className="gap-2 md:gap-4 shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 transition-all rounded-full px-4 md:px-12 h-10 md:h-20 font-black uppercase text-[9px] md:text-lg tracking-widest">
            <Link href="/matches/new">
              <Plus className="h-4 w-4 md:h-8 md:w-8" />
              <span>Record</span>
            </Link>
          </Button>
        </header>

        <main className="flex-1 p-4 md:p-12 space-y-8 md:space-y-16 w-full max-w-[1800px] mx-auto">
          <div className="relative w-full h-[250px] md:h-[500px] rounded-[1.5rem] md:rounded-[4rem] overflow-hidden shadow-2xl bg-primary">
            {heroImage && (
              <Image 
                src={heroImage.imageUrl} 
                alt={heroImage.description} 
                fill 
                className="object-cover opacity-40 mix-blend-overlay scale-105"
                data-ai-hint={heroImage.imageHint}
                priority
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary via-primary/60 to-transparent flex flex-col justify-center px-6 md:px-20">
              <Badge className="w-fit mb-3 md:mb-6 bg-white/20 text-white border-white/30 px-3 md:px-6 py-1 md:py-3 font-black uppercase tracking-[0.2em] text-[8px] md:text-xs" variant="outline">
                {matches.length === 0 ? 'ROOKIE ROSTER' : 'ELITE COMPETITOR'}
              </Badge>
              <h2 className="text-2xl md:text-8xl font-black tracking-tighter text-white mb-2 md:mb-8 drop-shadow-2xl max-w-4xl leading-none">
                {matches.length === 0 ? "Dominate the Court" : "Smash the Limits"}
              </h2>
              <p className="max-w-2xl text-white/90 text-xs md:text-2xl leading-relaxed mb-4 md:mb-12 font-bold tracking-tight">
                {matches.length === 0 
                  ? "Track every shuttlecock and analyze every set to climb the global rankings."
                  : `Conquered ${matches.length} matches with a professional ${stats.winRatio}% win rate.`}
              </p>
              <div className="flex">
                <Button asChild size="lg" className="rounded-xl md:rounded-[2.5rem] h-10 md:h-24 px-6 md:px-16 shadow-2xl bg-white text-primary hover:bg-white/90 font-black text-sm md:text-2xl border-none group">
                   <Link href="/matches/new" className="flex items-center">
                    New Victory <ArrowUpRight className="ml-2 md:ml-4 h-4 w-4 md:h-8 md:w-8 transition-transform group-hover:translate-x-2 group-hover:-translate-y-2" />
                   </Link>
                </Button>
              </div>
            </div>
          </div>

          {matches.length > 0 ? (
            <>
              <div className="grid gap-4 md:gap-10 grid-cols-2 lg:grid-cols-4">
                {[
                  { icon: Zap, title: "Best Ally", value: stats.bestAlly, color: "text-secondary", subtitle: "Highest Win Rate" },
                  { icon: UserPlus, title: "Frequent", value: stats.frequentPartner, color: "text-primary", subtitle: "Most Sessions" },
                  { icon: Swords, title: "Nemesis", value: stats.nemesis, color: "text-destructive", subtitle: "Hardest Rival" },
                  { icon: Heart, title: "Fav Rival", value: stats.favoriteRival, color: "text-secondary", subtitle: "Most Defeated" }
                ].map((stat, i) => (
                  <Card key={i} className="border-none shadow-2xl shadow-black/5 rounded-xl md:rounded-[3rem] bg-white overflow-hidden transition-all hover:translate-y-[-4px] md:hover:translate-y-[-10px]">
                    <CardHeader className="pb-1 md:pb-4 px-4 md:px-10 pt-4 md:pt-10">
                      <CardTitle className="text-[8px] md:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5 md:gap-3">
                        <stat.icon className={`h-3 w-3 md:h-5 md:w-5 ${stat.color}`} /> {stat.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 md:px-10 pb-4 md:pb-12">
                      <div className="text-sm md:text-4xl font-black tracking-tighter truncate">{stat.value}</div>
                      <p className="text-[7px] md:text-[11px] mt-1 md:mt-3 font-black uppercase text-muted-foreground/40">{stat.subtitle}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-6 md:gap-12 grid-cols-1 lg:grid-cols-5">
                <Card className="lg:col-span-2 border-none shadow-2xl shadow-black/5 bg-white rounded-xl md:rounded-[3rem] overflow-hidden">
                  <CardHeader className="border-b bg-muted/5 p-4 md:p-12">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 md:gap-6">
                        <div className="bg-secondary/10 p-2 md:p-4 rounded-lg md:rounded-2xl">
                          <Calendar className="h-4 w-4 md:h-8 md:w-8 text-secondary" />
                        </div>
                        <div>
                          <CardTitle className="text-sm md:text-3xl font-black uppercase tracking-tight">Recent Action</CardTitle>
                          <CardDescription className="text-[7px] md:text-xs font-black uppercase tracking-widest opacity-60">Last 5 Sessions</CardDescription>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild className="h-7 md:h-12 px-3 md:px-8 text-primary font-black uppercase text-[8px] md:text-sm tracking-widest rounded-full hover:bg-primary/5">
                        <Link href="/history">Full Log</Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-muted/30">
                      {recentMatches.map((match) => (
                        <div key={match.id} className="flex items-center justify-between p-3 md:p-10 hover:bg-muted/5 transition-all group">
                          <div className="flex items-center gap-3 md:gap-8 min-w-0">
                            <div className={`h-10 w-10 md:h-20 md:w-20 rounded-lg md:rounded-[2rem] flex items-center justify-center shadow-lg md:shadow-2xl shrink-0 transition-transform group-hover:scale-110 ${match.result === 'Win' ? 'bg-secondary text-white' : 'bg-destructive text-white'}`}>
                              {match.result === 'Win' ? <Trophy className="h-4 w-4 md:h-10 md:w-10" /> : <Frown className="h-4 w-4 md:h-10 md:w-10" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs md:text-2xl font-black truncate">{match.opponent}</p>
                              <div className="flex items-center text-[7px] md:text-xs text-muted-foreground uppercase font-black tracking-widest truncate mt-1 md:mt-3">
                                <Clock className="h-2.5 w-2.5 mr-1 md:h-4 md:w-4 md:mr-2 text-primary/60" /> {new Date(match.matchDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0 bg-muted/10 px-3 md:px-8 py-1.5 md:py-4 rounded-lg md:rounded-2xl">
                            <p className="text-[10px] md:text-2xl font-mono font-black text-foreground/80 tracking-tighter">
                              {match.myScore.join('-')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-3 border-none shadow-2xl shadow-black/5 bg-white rounded-xl md:rounded-[3rem] overflow-hidden">
                  <CardHeader className="border-b bg-muted/5 p-4 md:p-12">
                    <div className="flex items-center gap-3 md:gap-6">
                      <div className="bg-primary/10 p-2 md:p-4 rounded-lg md:rounded-2xl">
                        <LayoutGrid className="h-4 w-4 md:h-8 md:w-8 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-sm md:text-3xl font-black uppercase tracking-tight">Win Distribution</CardTitle>
                        <CardDescription className="text-[7px] md:text-xs font-black uppercase tracking-widest opacity-60">Victory Metrics</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 md:p-16 flex items-center justify-center min-h-[250px] md:min-h-[450px]">
                    <ChartContainer config={chartConfig} className="w-full h-full min-h-[200px] md:min-h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '900', letterSpacing: '0.1em', fill: '#666' }} />
                          <YAxis hide />
                          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                          <Bar dataKey="value" radius={[6, 6, 2, 2]} barSize={48}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} className="drop-shadow-lg md:drop-shadow-2xl" />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:gap-10 grid-cols-2 lg:grid-cols-4 pb-24">
                {[
                  { icon: Activity, title: "Sessions", value: stats.totalMatches, color: "primary", subtitle: "Total Games" },
                  { icon: Target, title: "Efficiency", value: `${stats.winRatio}%`, color: "secondary", subtitle: "Win Rate" },
                  { icon: Trophy, title: "Victories", value: stats.wins, color: "primary", invert: true, subtitle: "Games Won" },
                  { icon: Frown, title: "Defeats", value: stats.losses, color: "destructive", subtitle: "Games Lost" }
                ].map((stat, i) => (
                  <Card key={i} className={`border-none shadow-2xl shadow-black/5 rounded-xl md:rounded-[3rem] overflow-hidden transition-all md:hover:scale-[1.05] ${stat.invert ? 'bg-primary text-primary-foreground shadow-primary/30' : 'bg-white'}`}>
                    <CardHeader className="pb-1 md:pb-2 px-6 md:px-12 pt-6 md:pt-12">
                      <CardTitle className={`text-[8px] md:text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 md:gap-4 ${stat.invert ? 'opacity-70' : 'text-muted-foreground'}`}>
                        <stat.icon className={`h-4 w-4 md:h-6 md:w-6 ${stat.invert ? '' : `text-${stat.color}`}`} /> {stat.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 md:px-12 pb-6 md:pb-16">
                      <div className="text-2xl md:text-8xl font-black tracking-tighter">{stat.value}</div>
                      <p className={`text-[7px] md:text-xs mt-2 md:mt-6 font-black uppercase tracking-widest ${stat.invert ? 'opacity-50' : 'text-muted-foreground/40'}`}>{stat.subtitle}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 mt-6 md:mt-12 pb-32">
              {[
                { icon: Target, title: "Precision", desc: "Log every point to visualize your technical consistency and growth." },
                { icon: Trophy, title: "Tournaments", desc: "Group matches by event to track your championship trajectory over time." },
                { icon: TrendingUp, title: "Analytics", desc: "Unlock professional trends and automated high-depth data visualizations." }
              ].map((feature, i) => (
                <Card key={i} className="border-none shadow-2xl shadow-black/5 p-6 md:p-14 bg-white rounded-xl md:rounded-[4rem] transition-all md:hover:translate-y-[-12px]">
                  <CardContent className="p-0">
                    <div className="h-12 w-12 md:h-28 md:w-28 rounded-xl md:rounded-[2rem] bg-primary/10 flex items-center justify-center mb-6 md:mb-10">
                      <feature.icon className="h-6 w-6 md:h-14 md:w-14 text-primary" />
                    </div>
                    <h3 className="font-black text-lg md:text-4xl mb-2 md:mb-6 tracking-tighter uppercase">{feature.title}</h3>
                    <p className="text-xs md:text-xl text-muted-foreground leading-relaxed font-bold opacity-70">{feature.desc}</p>
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
