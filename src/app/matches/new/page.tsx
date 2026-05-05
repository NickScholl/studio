"use client"

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { MatchService, MatchType, MatchResult } from '@/lib/match-service'
import { ChevronLeft, Info, MapPin, Users, Target, User, Swords } from 'lucide-react'
import Link from 'next/link'

export default function NewMatch() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [matchType, setMatchType] = React.useState<MatchType>('Singles')

  const isDoubles = matchType === 'Doubles' || matchType === 'Mixed Doubles'

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const matchData = {
      date: formData.get('date') as string,
      type: matchType,
      myName: formData.get('myName') as string,
      opponent: formData.get('opponent') as string,
      partner: isDoubles ? (formData.get('partner') as string) : undefined,
      opponentPartner: isDoubles ? (formData.get('opponentPartner') as string) : undefined,
      location: formData.get('location') as string,
      myScore: [
        Number(formData.get('set1_mine')),
        Number(formData.get('set2_mine')),
        formData.get('set3_mine') ? Number(formData.get('set3_mine')) : 0
      ].filter(score => score > 0),
      opponentScore: [
        Number(formData.get('set1_opp')),
        Number(formData.get('set2_opp')),
        formData.get('set3_opp') ? Number(formData.get('set3_opp')) : 0
      ].filter(score => score > 0),
      result: formData.get('result') as MatchResult,
      notes: formData.get('notes') as string,
    }

    try {
      MatchService.addMatch(matchData)
      toast({
        title: "Match Submitted!",
        description: `Your match has been recorded.`,
      })
      router.push('/')
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save match data.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6">
          <SidebarTrigger className="-ml-1" />
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-lg font-headline font-semibold">Submit Match Results</h1>
        </header>

        <main className="max-w-3xl mx-auto p-6 lg:p-10 w-full">
          <Card className="shadow-lg border-2 border-primary/5">
            <CardHeader className="bg-primary/5 rounded-t-lg">
              <CardTitle>Match Details</CardTitle>
              <CardDescription>Enter the players and scores of the badminton match.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date">Match Date</Label>
                    <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Match Type</Label>
                    <Select value={matchType} onValueChange={(v) => setMatchType(v as MatchType)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Singles">Singles</SelectItem>
                        <SelectItem value="Doubles">Doubles</SelectItem>
                        <SelectItem value="Mixed Doubles">Mixed Doubles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location / Venue</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="location" name="location" placeholder="e.g. Smash Badminton Hall" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="result">Result (for Team 1)</Label>
                    <Select name="result" defaultValue="Win">
                      <SelectTrigger>
                        <SelectValue placeholder="Match outcome" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Win">Victory (Win)</SelectItem>
                        <SelectItem value="Loss">Defeat (Loss)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid gap-8 md:grid-cols-2">
                    {/* Team 1 */}
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/5">
                      <h3 className="text-sm font-bold uppercase text-primary flex items-center gap-2">
                        <User className="h-4 w-4" /> Team 1
                      </h3>
                      <div className="space-y-2">
                        <Label htmlFor="myName">Player Name</Label>
                        <Input id="myName" name="myName" placeholder="Main player" required />
                      </div>
                      {isDoubles && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                          <Label htmlFor="partner">Partner Name</Label>
                          <Input id="partner" name="partner" placeholder="Partner" required={isDoubles} />
                        </div>
                      )}
                    </div>

                    {/* Team 2 */}
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/5">
                      <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
                        <Swords className="h-4 w-4" /> Team 2 (Opponents)
                      </h3>
                      <div className="space-y-2">
                        <Label htmlFor="opponent">Opponent 1</Label>
                        <Input id="opponent" name="opponent" placeholder="Main opponent" required />
                      </div>
                      {isDoubles && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                          <Label htmlFor="opponentPartner">Opponent 2 (Partner)</Label>
                          <Input id="opponentPartner" name="opponentPartner" placeholder="Opponent partner" required={isDoubles} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <Label className="font-bold">Set Scores</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-muted-foreground">Set 1</Label>
                      <div className="flex gap-2">
                        <Input name="set1_mine" placeholder="T1" type="number" required />
                        <Input name="set1_opp" placeholder="T2" type="number" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-muted-foreground">Set 2</Label>
                      <div className="flex gap-2">
                        <Input name="set2_mine" placeholder="T1" type="number" required />
                        <Input name="set2_opp" placeholder="T2" type="number" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-muted-foreground">Set 3 (Optional)</Label>
                      <div className="flex gap-2">
                        <Input name="set3_mine" placeholder="T1" type="number" />
                        <Input name="set3_opp" placeholder="T2" type="number" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Match Notes</Label>
                  <Textarea id="notes" name="notes" placeholder="Any specific details or things to improve on?" />
                </div>

                <div className="pt-4 flex flex-col md:flex-row gap-4">
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? "Submitting..." : "Save Match Stats"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/">Cancel</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6 flex items-start gap-3 p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
            <Info className="h-5 w-5 mt-0.5 text-primary" />
            <p>
              Recording matches for different players helps you manage group stats or your personal historical performance!
            </p>
          </div>
        </main>
      </SidebarInset>
    </div>
  )
}
