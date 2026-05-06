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

    const partnerCounts: Record<string, number> = {};
    const winPartnerCounts: Record<string, number> = {};
    const lossOpponentCounts: Record<string, number> = {};
    const winOpponentCounts: Record<string, number> = {};

    matches.forEach(m => {
      if (m.partner) {
        partnerCounts[m.partner] = (partnerCounts[m.partner] || 0) + 1;
        if (m.result === 'Win') {
          winPartnerCounts[m.partner] = (winPartnerCounts[m.partner] || 0) + 1;
        }
      }

      if (m.result === 'Loss') {
        lossOpponentCounts[m.opponent] = (lossOpponentCounts[m.opponent] || 0) + 1;
        if (m.opponentPartner) {
          lossOpponentCounts[m.opponentPartner] = (lossOpponentCounts[m.opponentPartner] || 0) + 1;
        }
      } else if (m.result === 'Win') {
        winOpponentCounts[m.opponent] = (winOpponentCounts[m.opponent] || 0) + 1;
        if (m.opponentPartner) {
          winOpponentCounts[m.opponentPartner] = (winOpponentCounts[m.opponentPartner] || 0) + 1;
        }
      }
    });

    const findMax = (counts: Record<string, number>) => {
      let maxVal = 0;
      let maxKey = 'N/A';
      Object.entries(counts).forEach(([key, val]) => {
        if (val > maxVal) {
          maxVal = val;
          maxKey = key;
        }
      });
      return maxVal > 0 ? maxKey : 'N/A';
    };

    return {
      totalMatches,
      wins,
      losses,
      winRatio: Math.round(winRatio * 10) / 10,
      bestAlly: findMax(winPartnerCounts),
      frequentPartner: findMax(partnerCounts),
      nemesis: findMax(lossOpponentCounts),
      favoriteRival: findMax(winOpponentCounts)
    };
  }
};
