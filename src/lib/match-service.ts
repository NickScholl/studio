
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  Firestore,
} from 'firebase/firestore';

export type MatchType = 'Singles' | 'Doubles' | 'Mixed Doubles';
export type MatchResult = 'Win' | 'Loss';

export interface BadmintonMatch {
  id: string;
  matchDate: string;
  matchType: MatchType;
  competitionName?: string;
  myName: string;
  opponent: string;
  partner?: string;
  opponentPartner?: string;
  location: string;
  myScore: number[];
  opponentScore: number[];
  result: MatchResult;
  notes?: string;
  submittedByUserId: string;
  participantUserIds: string[];
  createdAt?: any;
}

export const MatchService = {
  addMatch: async (db: Firestore, userId: string, match: any) => {
    const matchesRef = collection(db, 'matches');
    
    // Ensure we use the right property names from the form
    const rawDate = match.matchDate || match.date;
    const formattedDate = rawDate ? new Date(rawDate).toISOString() : new Date().toISOString();

    const docData = {
      matchDate: formattedDate,
      matchType: match.matchType || match.type || 'Singles',
      competitionName: match.competitionName || 'Casual / Friendly',
      myName: match.myName || 'Player',
      opponent: match.opponent || 'Opponent',
      partner: match.partner || null,
      opponentPartner: match.opponentPartner || null,
      location: match.location || 'Unknown Venue',
      myScore: match.myScore || [],
      opponentScore: match.opponentScore || [],
      result: match.result || 'Win',
      notes: match.notes || '',
      submittedByUserId: userId,
      participantUserIds: [userId], 
      createdAt: serverTimestamp(),
    };

    return addDoc(matchesRef, docData);
  },

  calculateStats: (matches: BadmintonMatch[]) => {
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
        Singles: matches.filter(m => m.matchType === 'Singles').length,
        Doubles: matches.filter(m => m.matchType === 'Doubles').length,
        MixedDoubles: matches.filter(m => m.matchType === 'Mixed Doubles').length,
      }
    };
  }
};
