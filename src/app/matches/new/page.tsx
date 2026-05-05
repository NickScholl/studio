
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
import { ChevronLeft, Info } from 'lucide-react'
import Link from 'next/link'

export default function NewMatch() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const matchData = {
      date: formData.get('date') as string,
      type: formData.get('type') as MatchType,
      opponent: formData.get('opponent') as string,
      partner: formData.get('partner') as string || undefined,
      myScore: [
        Number(formData.get('set1_mine')),
        Number(formData.get('set2_mine')),
        formData.get('set3_mine') ? Number(formData.get('set3_mine')) : 0
      ].filter(Boolean),
      opponentScore: [
        Number(formData.get('set1_opp')),
        Number(formData.get('set2_opp')),
        formData.get('set3_opp') ? Number(formData.get('set3_opp')) : 0
      ].filter(Boolean),
      result: formData.get('result') as MatchResult,
      notes: formData.get('notes') as string,
    }

    try {
      MatchService.addMatch(matchData)
      toast({
        title: "Match Submitted!",
        description: `Your match against ${matchData.opponent} has been recorded.`,
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
              <CardDescription>Enter the scores and details of your badminton session.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date">Match Date</Label>
                    <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Match Type</Label>
                    <Select name="type" defaultValue="Singles">
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
                    <Label htmlFor="opponent">Opponent Name</Label>
                    <Input id="opponent" name="opponent" placeholder="Enter opponent name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="result">Result</Label>
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

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <Label className="font-bold">Set Scores</Label>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-muted-foreground">Set 1</Label>
                      <div className="flex gap-2">
                        <Input name="set1_mine" placeholder="Me" type="number" required />
                        <Input name="set1_opp" placeholder="Opp" type="number" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-muted-foreground">Set 2</Label>
                      <div className="flex gap-2">
                        <Input name="set2_mine" placeholder="Me" type="number" required />
                        <Input name="set2_opp" placeholder="Opp" type="number" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-muted-foreground">Set 3 (Optional)</Label>
                      <div className="flex gap-2">
                        <Input name="set3_mine" placeholder="Me" type="number" />
                        <Input name="set3_opp" placeholder="Opp" type="number" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Match Notes</Label>
                  <Textarea id="notes" name="notes" placeholder="Any specific details or things to improve on?" />
                </div>

                <div className="pt-4 flex gap-4">
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
              Your stats will be automatically updated on the dashboard once you submit this match. 
              Consistent tracking helps you identify patterns in your gameplay!
            </p>
          </div>
        </main>
      </SidebarInset>
    </div>
  )
}

import { Target } from 'lucide-react'
