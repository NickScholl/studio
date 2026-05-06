
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
  ChevronRight,
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
    <div className="flex min-h-screen bg-[#f8f9fc]">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-white/80 backdrop-blur-md px-6 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <div className="flex flex-col">
              <h1 className="text-lg font-black tracking-tight text-foreground uppercase leading-none">Court Intel</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60 mt-1">{user.displayName || 'Elite Player'}</p>
            </div>
          </div>
          <Button asChild className="gap-2 shadow-2xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all rounded-full px-8 h-10 font-black uppercase text-xs tracking-widest">
            <Link href="/matches/new">
              <Plus className="h-4 w-4" />
              <span>Record Match</span>
            </Link>
          </Button>
        </header>

        <main className="flex-1 space-y-10 p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
          {/* Hero Section */}
          <div className="relative w-full h-[360px] md:h-[440px] rounded-[3rem] overflow-hidden shadow-2xl bg-primary animate-in fade-in duration-1000">
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
            <div className="absolute inset-0 bg-gradient-to-tr from-primary via-primary/70 to-transparent flex flex-col justify-center px-10 md:px-20">
              <Badge className="w-fit mb-8 bg-white/10 hover:bg-white/20 text-white backdrop-blur-xl border-white/20 px-6 py-2 font-black uppercase tracking-[0.2em] text-[10px]" variant="outline">
                {matches.length === 0 ? 'ROOKIE STATUS' : 'ELITE COMPETITOR'}
              </Badge>
              <h2 className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-6 drop-shadow-2xl">
                {matches.length === 0 ? "Dominate" : "Smash It!"}
              </h2>
              <p className="max-w-xl text-white/90 text-xl md:text-2xl leading-tight mb-12 font-bold tracking-tight opacity-90">
                {matches.length === 0 
                  ? "Track every shuttlecock, analyze every set, and climb the global rankings."
                  : `You've conquered ${matches.length} matches with a ${stats.winRatio}% win rate. The court is yours.`}
              </p>
              <div className="flex flex-wrap gap-5">
                <Button asChild size="lg" className="rounded-2xl h-16 px-12 shadow-2xl bg-white text-primary hover:bg-white/90 font-black text-lg border-none transition-all hover:scale-105 active:scale-95 group">
                   <Link href="/matches/new" className="flex items-center">
                    New Victory <ArrowUpRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                   </Link>
                </Button>
              </div>
            </div>
          </div>

          {matches.length > 0 ? (
            <>
              {/* Rivalries & Alliances */}
              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
                {[
                  { icon: Zap, title: "Best Ally", value: stats.bestAlly, color: "secondary", subtitle: "Most wins together" },
                  { icon: UserPlus, title: "Frequent Partner", value: stats.frequentPartner, color: "primary", subtitle: "Most matches played" },
                  { icon: Swords, title: "Nemesis", value: stats.nemesis, color: "destructive", subtitle: "Hardest to beat" },
                  { icon: Heart, title: "Favorite Rival", value: stats.favoriteRival, color: "secondary", subtitle: "Most wins against" }
                ].map((stat, i) => (
                  <Card key={i} className="border-none shadow-2xl shadow-black/5 hover:translate-y-[-6px] transition-all duration-300 rounded-[2.5rem] bg-white overflow-hidden group">
                    <CardHeader className="pb-2 px-8 pt-8">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                          <stat.icon className={`h-3 w-3 text-${stat.color}`} /> {stat.title}
                        </CardTitle>
                        <div className={`p-2 bg-${stat.color}/10 rounded-xl group-hover:rotate-12 transition-transform`}>
                          <stat.icon className={`h-4 w-4 text-${stat.color}`} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                      <div className="text-2xl font-black tracking-tighter truncate">{stat.value}</div>
                      <p className="text-[10px] mt-2 font-black uppercase tracking-widest text-muted-foreground/60">{stat.subtitle}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Main Analytics Hub */}
              <div className="grid gap-10 lg:grid-cols-5">
                {/* Recent Action - Summarized History */}
                <Card className="lg:col-span-2 border-none shadow-2xl shadow-black/5 flex flex-col overflow-hidden bg-white rounded-[3rem]">
                  <CardHeader className="border-b bg-muted/5 p-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-secondary/10 rounded-2xl">
                          <Calendar className="h-6 w-6 text-secondary" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl font-black tracking-tight uppercase">Recent Action</CardTitle>
                          <CardDescription className="text-[10px] font-black uppercase tracking-widest opacity-60">Last 5 Sessions</CardDescription>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild className="h-10 px-5 text-primary hover:bg-primary/5 font-black uppercase text-[10px] tracking-widest rounded-full">
                        <Link href="/history">Full Log</Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-0">
                    <div className="divide-y divide-muted/30">
                      {recentMatches.map((match) => (
                        <div key={match.id} className="flex items-center justify-between p-8 hover:bg-muted/10 transition-all group cursor-default">
                          <div className="flex items-center gap-6">
                            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform ${match.result === 'Win' ? 'bg-secondary text-white shadow-secondary/40' : 'bg-destructive text-white shadow-destructive/40'}`}>
                              {match.result === 'Win' ? <Trophy className="h-7 w-7" /> : <Frown className="h-7 w-7" />}
                            </div>
                            <div>
                              <p className="text-lg font-black group-hover:text-primary transition-colors tracking-tight">vs {match.opponent}</p>
                              <div className="flex items-center text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1 opacity-70">
                                <MapPin className="h-3 w-3 mr-2 text-primary/60" /> {match.location}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={match.result === 'Win' ? 'secondary' : 'destructive'} className="text-[9px] px-3 py-1 font-black uppercase tracking-widest shadow-lg">
                              {match.result}
                            </Badge>
                            <p className="text-base mt-2 font-mono font-black text-foreground/80 tracking-tighter">
                              {match.myScore.join('-')} | {match.opponentScore.join('-')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Breakdown - Charts */}
                <Card className="lg:col-span-3 border-none shadow-2xl shadow-black/5 flex flex-col overflow-hidden bg-white rounded-[3rem]">
                  <CardHeader className="border-b bg-muted/5 p-10">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-primary/10 rounded-2xl">
                        <LayoutGrid className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-black tracking-tight uppercase">Win Distribution</CardTitle>
                        <CardDescription className="text-[10px] font-black uppercase tracking-widest opacity-60">Success metrics visualization</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-10 flex items-center justify-center min-h-[440px]">
                    <ChartContainer config={config} className="w-full max-w-2xl">
                      <ResponsiveContainer width="100%" height={340}>
                        <BarChart data={chartData}>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: '900', letterSpacing: '0.1em' }} />
                          <YAxis hide />
                          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                          <Bar dataKey="value" radius={[16, 16, 4, 4]} barSize={120}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} className="filter drop-shadow-2xl" />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { icon: Activity, title: "Total Matches", value: stats.totalMatches, color: "primary", subtitle: "Archived sessions" },
                  { icon: Target, title: "Efficiency", value: `${stats.winRatio}%`, color: "secondary", subtitle: "Win percentage" },
                  { icon: Trophy, title: "Victories", value: stats.wins, color: "primary", invert: true, subtitle: "Matches won" },
                  { icon: Frown, title: "Learning", value: stats.losses, color: "destructive", subtitle: "Match defeats" }
                ].map((stat, i) => (
                  <Card key={i} className={`border-none shadow-2xl shadow-black/5 hover:translate-y-[-6px] transition-all duration-300 rounded-[2rem] overflow-hidden ${stat.invert ? 'bg-primary text-primary-foreground shadow-primary/30' : 'bg-white'}`}>
                    <CardHeader className="pb-2 px-8 pt-8">
                      <CardTitle className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${stat.invert ? 'opacity-80' : 'text-muted-foreground'}`}>
                        <stat.icon className={`h-3 w-3 ${stat.invert ? '' : `text-${stat.color}`}`} /> {stat.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                      <div className="text-6xl font-black tracking-tighter">{stat.value}</div>
                      <p className={`text-[10px] mt-2 font-black uppercase tracking-widest ${stat.invert ? 'opacity-60' : 'text-muted-foreground/60'}`}>{stat.subtitle}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            /* Empty State Features */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-12">
              {[
                { icon: Target, title: "Shot Precision", desc: "Log every point to visualize your efficiency and technical consistency over time." },
                { icon: Trophy, title: "Event Archiving", desc: "Group matches by tournament to track your championship trajectory and podium finishes." },
                { icon: TrendingUp, title: "Elite Analytics", desc: "Unlock professional performance trends and automated win-loss data visualizations." }
              ].map((feature, i) => (
                <Card key={i} className="border-none shadow-2xl shadow-black/5 hover:scale-[1.03] transition-all p-10 bg-white rounded-[3rem]">
                  <CardContent className="p-0">
                    <div className="h-20 w-20 rounded-[2rem] bg-primary/10 flex items-center justify-center mb-10 shadow-inner">
                      <feature.icon className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="font-black text-3xl mb-4 tracking-tighter uppercase">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed font-bold opacity-70">{feature.desc}</p>
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
