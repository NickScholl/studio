
"use client"

import * as React from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { BadmintonMatch, MatchService } from '@/lib/match-service'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Filter, Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function MatchHistory() {
  const [matches, setMatches] = React.useState<BadmintonMatch[]>([])
  const [searchTerm, setSearchTerm] = React.useState('')

  React.useEffect(() => {
    setMatches(MatchService.getMatches())
  }, [])

  const filteredMatches = matches.filter(m => 
    m.opponent.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-lg font-headline font-semibold">Match History</h1>
          </div>
        </header>

        <main className="p-6 lg:p-10 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by opponent or match type..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar className="h-4 w-4" />
                Sort Date
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">All Matches</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredMatches.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Opponent</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMatches.map((match) => (
                      <TableRow key={match.id}>
                        <TableCell className="font-medium">
                          {new Date(match.date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell>{match.type}</TableCell>
                        <TableCell>{match.opponent}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {match.myScore.map((score, idx) => (
                              <span key={idx} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                {score}-{match.opponentScore[idx]}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={match.result === 'Win' ? 'default' : 'destructive'} className={match.result === 'Win' ? 'bg-secondary' : ''}>
                            {match.result}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">Details</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-20 bg-muted/10 rounded-lg border-2 border-dashed">
                  <div className="inline-flex items-center justify-center p-4 bg-muted rounded-full mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No matches found</h3>
                  <p className="text-muted-foreground">Start by submitting your first badminton match!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </div>
  )
}
