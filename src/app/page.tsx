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
        <div className="text-center space-y-12">
          <Loader2 className="h-24 w-24 animate-spin text-primary mx-auto" />
          <p className="text-3xl text-muted-foreground animate-pulse font-black uppercase tracking-[0.5em]">SYNCING ELITE DATA</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <AppSidebar />
      <SidebarInset className="flex flex-col flex-1 min-w-0 bg-[#f8f9fc] overflow-x-hidden">
        <header className="flex h-20 md:h-32 shrink-0 items-center justify-between gap-4 border-b bg-white/95 backdrop-blur-xl px-4 md:px-16 sticky top-0 z-50 shadow-sm w-full">
          <div className="flex items-center gap-4 md:gap-12">
            <SidebarTrigger className="-ml-1 h-10 w-10 md:h-20 md:w-20" />
            <div className="flex flex-col">
              <h1 className="text-xl md:text-6xl font-black tracking-tighter text-foreground uppercase leading-none">Tactical Intel</h1>
              <p className="text-[8px] md:text-lg text-muted-foreground uppercase tracking-[0.4em] font-black mt-2 hidden xs:block">{user.displayName || 'PRO PLAYER'}</p>
            </div>
          </div>
          <Button asChild size="lg" className="gap-2 md:gap-6 shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 transition-all rounded-full px-6 md:px-16 h-12 md:h-24 font-black uppercase text-[10px] md:text-2xl tracking-widest">
            <Link href="/matches/new">
              <Plus className="h-4 w-4 md:h-12 md:w-12" />
              <span>Record Action</span>
            </Link>
          </Button>
        </header>

        <main className="flex-1 p-4 md:p-16 space-y-12 md:space-y-24 w-full max-w-none mx-auto pb-64 overflow-x-hidden">
          <div className="relative w-full h-[300px] md:h-[600px] rounded-[2rem] md:rounded-[5rem] overflow-hidden shadow-2xl bg-primary">
            {heroImage && (
              <Image 
                src={heroImage.imageUrl} 
                alt={heroImage.description} 
                fill 
                className="object-cover opacity-40 mix-blend-overlay scale-110"
                data-ai-hint={heroImage.imageHint}
                priority
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary via-primary/60 to-transparent flex flex-col justify-center px-8 md:px-24">
              <Badge className="w-fit mb-4 md:mb-10 bg-white/20 text-white border-white/30 px-4 md:px-10 py-2 md:py-5 font-black uppercase tracking-[0.3em] text-[10px] md:text-lg" variant="outline">
                {matches.length === 0 ? 'ENTRY ROSTER' : 'ELITE COMPETITOR'}
              </Badge>
              <h2 className="text-3xl md:text-9xl font-black tracking-tighter text-white mb-4 md:mb-12 drop-shadow-2xl max-w-6xl leading-none">
                {matches.length === 0 ? "Dominate the Court" : "Smash the Limits"}
              </h2>
              <p className="max-w-4xl text-white/90 text-sm md:text-3xl leading-relaxed mb-8 md:mb-16 font-bold tracking-tight opacity-90">
                {matches.length === 0 
                  ? "Track every shuttlecock and analyze every tactical set to climb the global badminton rankings."
                  : `Conquered ${matches.length} matches with a professional ${stats.winRatio}% win efficiency.`}
              </p>
              <div className="flex">
                <Button asChild size="lg" className="rounded-2xl md:rounded-[3rem] h-14 md:h-32 px-8 md:px-24 shadow-2xl bg-white text-primary hover:bg-white/90 font-black text-lg md:text-4xl border-none group">
                   <Link href="/matches/new" className="flex items-center">
                    New Victory <ArrowUpRight className="ml-3 md:ml-6 h-6 w-6 md:h-12 md:w-12 transition-transform group-hover:translate-x-3 group-hover:-translate-y-3" />
                   </Link>
                </Button>
              </div>
            </div>
          </div>

          {matches.length > 0 ? (
            <>
              <div className="grid gap-6 md:gap-16 grid-cols-2 lg:grid-cols-4">
                {[
                  { icon: Zap, title: "Best Ally", value: stats.bestAlly, color: "text-secondary", subtitle: "Win Rate Dominance" },
                  { icon: UserPlus, title: "Frequent", value: stats.frequentPartner, color: "text-primary", subtitle: "Total Sessions" },
                  { icon: Swords, title: "Nemesis", value: stats.nemesis, color: "text-destructive", subtitle: "Rival Resistance" },
                  { icon: Heart, title: "Fav Rival", value: stats.favoriteRival, color: "text-secondary", subtitle: "Victory Target" }
                ].map((stat, i) => (
                  <Card key={i} className="border-none shadow-2xl shadow-black/5 rounded-2xl md:rounded-[4rem] bg-white overflow-hidden transition-all hover:translate-y-[-10px] md:hover:translate-y-[-20px]">
                    <CardHeader className="pb-2 md:pb-8 px-6 md:px-16 pt-6 md:pt-16">
                      <CardTitle className="text-[10px] md:text-xl font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2 md:gap-6">
                        <stat.icon className={`h-4 w-4 md:h-10 md:w-10 ${stat.color}`} /> {stat.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 md:px-16 pb-8 md:pb-20">
                      <div className="text-xl md:text-5xl font-black tracking-tighter truncate leading-none">{stat.value}</div>
                      <p className="text-[8px] md:text-lg mt-2 md:mt-6 font-black uppercase text-muted-foreground/30 tracking-widest">{stat.subtitle}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-8 md:gap-24 grid-cols-1 lg:grid-cols-5">
                <Card className="lg:col-span-2 border-none shadow-2xl shadow-black/5 bg-white rounded-2xl md:rounded-[4rem] overflow-hidden">
                  <CardHeader className="border-b bg-muted/5 p-6 md:p-20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 md:gap-10">
                        <div className="bg-secondary/10 p-3 md:p-8 rounded-2xl md:rounded-[2.5rem]">
                          <Calendar className="h-6 w-6 md:h-12 md:w-12 text-secondary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl md:text-5xl font-black uppercase tracking-tight">Timeline Action</CardTitle>
                          <CardDescription className="text-[10px] md:text-xl font-black uppercase tracking-[0.3em] opacity-40 mt-1">Last 5 Sessions</CardDescription>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild className="h-10 md:h-20 px-6 md:px-12 text-primary font-black uppercase text-[10px] md:text-xl tracking-widest rounded-full hover:bg-primary/5">
                        <Link href="/history">Tactical Log</Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-muted/30">
                      {recentMatches.map((match) => (
                        <div key={match.id} className="flex items-center justify-between p-6 md:p-16 hover:bg-muted/5 transition-all group">
                          <div className="flex items-center gap-6 md:gap-12 min-w-0">
                            <div className={`h-12 w-12 md:h-28 md:w-28 rounded-2xl md:rounded-[3rem] flex items-center justify-center shadow-2xl shrink-0 transition-transform group-hover:scale-110 ${match.result === 'Win' ? 'bg-secondary text-white' : 'bg-destructive text-white'}`}>
                              {match.result === 'Win' ? <Trophy className="h-6 w-6 md:h-14 md:w-14" /> : <Frown className="h-6 w-6 md:h-14 md:w-14" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-lg md:text-4xl font-black truncate tracking-tighter">{match.opponent}</p>
                              <div className="flex items-center text-[10px] md:text-xl text-muted-foreground uppercase font-black tracking-[0.2em] truncate mt-2 md:mt-5 opacity-40">
                                <Clock className="h-3 w-3 md:h-6 md:w-6 mr-2 md:mr-5 text-primary" /> {new Date(match.matchDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0 bg-muted/10 px-6 md:px-12 py-3 md:py-8 rounded-2xl md:rounded-[2.5rem]">
                            <p className="text-xl md:text-5xl font-mono font-black text-foreground/80 tracking-tighter">
                              {match.myScore.join('-')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-3 border-none shadow-2xl shadow-black/5 bg-white rounded-2xl md:rounded-[4rem] overflow-hidden">
                  <CardHeader className="border-b bg-muted/5 p-6 md:p-20">
                    <div className="flex items-center gap-4 md:gap-10">
                      <div className="bg-primary/10 p-3 md:p-8 rounded-2xl md:rounded-[2.5rem]">
                        <LayoutGrid className="h-6 w-6 md:h-12 md:w-12 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl md:text-5xl font-black uppercase tracking-tight">Performance Flow</CardTitle>
                        <CardDescription className="text-[10px] md:text-xl font-black uppercase tracking-[0.3em] opacity-40 mt-1">Victory Metrics Distribution</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 md:p-24 flex items-center justify-center min-h-[400px] md:min-h-[700px]">
                    <ChartContainer config={chartConfig} className="w-full h-full min-h-[300px] md:min-h-[600px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 14, fontWeight: '900', letterSpacing: '0.2em', fill: '#666' }} />
                          <YAxis hide />
                          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                          <Bar dataKey="value" radius={[12, 12, 4, 4]} barSize={80}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} className="drop-shadow-2xl" />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:gap-16 grid-cols-2 lg:grid-cols-4 pb-32">
                {[
                  { icon: Activity, title: "Sessions", value: stats.totalMatches, color: "primary", subtitle: "Total Action" },
                  { icon: Target, title: "Efficiency", value: `${stats.winRatio}%`, color: "secondary", subtitle: "Win Rate" },
                  { icon: Trophy, title: "Victories", value: stats.wins, color: "primary", invert: true, subtitle: "Games Won" },
                  { icon: Frown, title: "Defeats", value: stats.losses, color: "destructive", subtitle: "Games Lost" }
                ].map((stat, i) => (
                  <Card key={i} className={`border-none shadow-2xl shadow-black/5 rounded-2xl md:rounded-[4.5rem] overflow-hidden transition-all md:hover:scale-[1.08] ${stat.invert ? 'bg-primary text-primary-foreground shadow-primary/40' : 'bg-white'}`}>
                    <CardHeader className="pb-2 md:pb-6 px-8 md:px-20 pt-8 md:pt-20">
                      <CardTitle className={`text-[10px] md:text-xl font-black uppercase tracking-[0.4em] flex items-center gap-3 md:gap-8 ${stat.invert ? 'opacity-60' : 'text-muted-foreground'}`}>
                        <stat.icon className={`h-5 w-5 md:h-12 md:w-12 ${stat.invert ? '' : `text-${stat.color}`}`} /> {stat.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-8 md:px-20 pb-10 md:pb-24">
                      <div className="text-3xl md:text-[10rem] font-black tracking-tighter leading-none">{stat.value}</div>
                      <p className={`text-[8px] md:text-xl mt-4 md:mt-12 font-black uppercase tracking-[0.3em] ${stat.invert ? 'opacity-40' : 'text-muted-foreground/30'}`}>{stat.subtitle}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-20 mt-12 md:mt-24 pb-48">
              {[
                { icon: Target, title: "Precision", desc: "Log every shuttlecock point to visualize your elite consistency and technical growth." },
                { icon: Trophy, title: "Tournaments", desc: "Group matches by event to track your professional championship trajectory over time." },
                { icon: TrendingUp, title: "Analytics", desc: "Unlock world-class tactical trends and automated professional visualizations." }
              ].map((feature, i) => (
                <Card key={i} className="border-none shadow-2xl shadow-black/5 p-8 md:p-24 bg-white rounded-2xl md:rounded-[5rem] transition-all md:hover:translate-y-[-24px]">
                  <CardContent className="p-0">
                    <div className="h-16 w-16 md:h-40 md:w-40 rounded-2xl md:rounded-[3rem] bg-primary/10 flex items-center justify-center mb-10 md:mb-20">
                      <feature.icon className="h-8 w-8 md:h-20 md:w-20 text-primary" />
                    </div>
                    <h3 className="font-black text-xl md:text-6xl mb-4 md:mb-12 tracking-tighter uppercase">{feature.title}</h3>
                    <p className="text-sm md:text-2xl text-muted-foreground leading-relaxed font-bold opacity-80">{feature.desc}</p>
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
