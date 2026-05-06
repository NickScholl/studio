
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
  addMatch: async (db: Firestore, userId: string, match: Omit<BadmintonMatch, 'id' | 'submittedByUserId' | 'participantUserIds'>) => {
    const matchesRef = collection(db, 'matches');
    
    // Explicitly construct the data for Firestore to ensure rules pass
    const docData = {
      matchDate: new Date(match.matchDate).toISOString(),
      matchType: match.type || match.matchType,
      competitionName: match.competitionName || 'Casual / Friendly',
      myName: match.myName,
      opponent: match.opponent,
      partner: match.partner || null,
      opponentPartner: match.opponentPartner || null,
      location: match.location,
      myScore: match.myScore,
      opponentScore: match.opponentScore,
      result: match.result,
      notes: match.notes || '',
      submittedByUserId: userId,
      participantUserIds: [userId], 
      createdAt: serverTimestamp(),
    };

    // Return the promise so the caller can await success
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
