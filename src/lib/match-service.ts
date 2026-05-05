
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  Firestore,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
  addMatch: (db: Firestore, userId: string, match: Omit<BadmintonMatch, 'id' | 'submittedByUserId' | 'participantUserIds'>) => {
    const matchesRef = collection(db, 'matches');
    
    // Ensure all required fields for Security Rules and grouping are present
    const docData = {
      ...match,
      submittedByUserId: userId,
      participantUserIds: [userId], // In a real doubles app, you'd add the partner's UID here too if they are a user
      createdAt: serverTimestamp(),
      competitionName: match.competitionName || 'Casual / Friendly',
    };

    // Non-blocking write
    addDoc(matchesRef, docData).catch(async (error) => {
      const permissionError = new FirestorePermissionError({
        path: matchesRef.path,
        operation: 'create',
        requestResourceData: docData,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
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
