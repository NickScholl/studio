export type MatchType = 'Singles' | 'Doubles' | 'Mixed Doubles';
export type MatchResult = 'Win' | 'Loss';

export interface BadmintonMatch {
  id: string;
  date: string;
  type: MatchType;
  myName: string;
  opponent: string;
  partner?: string;
  location: string;
  myScore: number[];
  opponentScore: number[];
  result: MatchResult;
  notes?: string;
}

const STORAGE_KEY = 'shuttlescore_matches';

export const MatchService = {
  getMatches: (): BadmintonMatch[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  addMatch: (match: Omit<BadmintonMatch, 'id'>): BadmintonMatch => {
    const matches = MatchService.getMatches();
    const newMatch = { ...match, id: Math.random().toString(36).substring(2, 11) };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newMatch, ...matches]));
    return newMatch;
  },

  getStats: () => {
    const matches = MatchService.getMatches();
    const totalMatches = matches.length;
    const wins = matches.filter(m => m.result === 'Win').length;
    const losses = totalMatches - wins;
    const winRatio = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

    return {
      totalMatches,
      wins,
      losses,
      winRatio: Math.round(winRatio * 10) / 10,
      matchesByType: {
        Singles: matches.filter(m => m.type === 'Singles').length,
        Doubles: matches.filter(m => m.type === 'Doubles').length,
        MixedDoubles: matches.filter(m => m.type === 'Mixed Doubles').length,
      }
    };
  }
};
