
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  Firestore,
  doc,
  updateDoc,
  getDoc
} from 'firebase/firestore';

export type MatchType = 'Singles' | 'Doubles' | 'Mixed Doubles';
export type MatchResult = 'Win' | 'Loss';

export interface BadmintonMatch {
  id: string;
  matchDate: string; // ISO string including time
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
  getMatch: async (db: Firestore, matchId: string) => {
    const docRef = doc(db, 'matches', matchId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as BadmintonMatch;
    }
    return null;
  },

  addMatch: async (db: Firestore, userId: string, match: any) => {
    const matchesRef = collection(db, 'matches');
    
    let formattedDate;
    if (match.date && match.time) {
      formattedDate = new Date(`${match.date}T${match.time}`).toISOString();
    } else {
      formattedDate = match.matchDate || new Date().toISOString();
    }

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

  updateMatch: async (db: Firestore, matchId: string, match: any) => {
    const docRef = doc(db, 'matches', matchId);
    
    let formattedDate;
    if (match.date && match.time) {
      formattedDate = new Date(`${match.date}T${match.time}`).toISOString();
    } else {
      formattedDate = match.matchDate || new Date().toISOString();
    }

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
      updatedAt: serverTimestamp(),
    };

    return updateDoc(docRef, docData);
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
