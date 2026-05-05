
"use client"

import * as React from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { BadmintonMatch, MatchService, MatchType, MatchResult } from '@/lib/match-service'
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
import { Search, MapPin, Users, Swords, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function MatchHistory() {
  const [matches, setMatches] = React.useState<BadmintonMatch[]>([])
  const [searchTerm, setSearchTerm] = React.useState('')
  const [filterType, setFilterType] = React.useState<string>('all')
  const [filterResult, setFilterResult] = React.useState<string>('all')

  React.useEffect(() => {
    setMatches(MatchService.getMatches())
  }, [])

  const filteredMatches = React.useMemo(() => {
    return matches.filter(m => {
      const search = searchTerm.toLowerCase()
      
      // Text Search Filter
      const matchesSearch = !searchTerm || (
        m.myName.toLowerCase().includes(search) ||
        m.opponent.toLowerCase().includes(search) ||
        (m.location && m.location.toLowerCase().includes(search)) ||
        (m.partner && m.partner.toLowerCase().includes(search)) ||
        (m.opponentPartner && m.opponentPartner.toLowerCase().includes(search))
      )

      // Type Filter
      const matchesType = filterType === 'all' || m.type === filterType

      // Result Filter
      const matchesResult = filterResult === 'all' || m.result === filterResult

      return matchesSearch && matchesType && matchesResult
    })
  }, [matches, searchTerm, filterType, filterResult])

  const clearFilters = () => {
    setSearchTerm('')
    setFilterType('all')
    setFilterResult('all')
  }

  const hasFilters = searchTerm !== '' || filterType !== 'all' || filterResult !== 'all'

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
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search players, partners or venues..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Match Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Singles">Singles</SelectItem>
                    <SelectItem value="Doubles">Doubles</SelectItem>
                    <SelectItem value="Mixed Doubles">Mixed Doubles</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterResult} onValueChange={setFilterResult}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Results</SelectItem>
                    <SelectItem value="Win">Win</SelectItem>
                    <SelectItem value="Loss">Loss</SelectItem>
                  </SelectContent>
                </Select>

                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Matches ({filteredMatches.length})</CardTitle>
                {hasFilters && (
                  <span className="text-xs text-muted-foreground">Showing filtered results</span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {filteredMatches.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Venue</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Matchup</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMatches.map((match) => (
                      <TableRow key={match.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>
                              {new Date(match.date).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                              <MapPin className="h-3 w-3 mr-1" />
                              {match.location}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal text-[10px]">
                            {match.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 text-sm">
                            <div className="flex flex-col">
                              <span className="font-semibold text-primary">{match.myName}</span>
                              {match.partner && (
                                <span className="text-[10px] text-muted-foreground flex items-center">
                                  <Users className="h-2 w-2 mr-1" /> & {match.partner}
                                </span>
                              )}
                            </div>
                            <Swords className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <div className="flex flex-col">
                              <span className="font-medium">{match.opponent}</span>
                              {match.opponentPartner && (
                                <span className="text-[10px] text-muted-foreground flex items-center">
                                  <Users className="h-2 w-2 mr-1" /> & {match.opponentPartner}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {match.myScore.map((score, idx) => (
                              <span key={idx} className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-20 bg-muted/10 rounded-lg border-2 border-dashed">
                  <div className="inline-flex items-center justify-center p-4 bg-muted rounded-full mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No matches match your criteria</h3>
                  <p className="text-muted-foreground mb-4">Try adjusting your filters or search terms.</p>
                  {hasFilters && (
                    <Button variant="outline" onClick={clearFilters}>Reset Filters</Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </div>
  )
}
