import type { ThisOrThatCategory, ThisOrThatPrompt } from './thisOrThatPrompts';

export type ThisOrThatVoter = { id: string; name: string; c1: string; c2: string };

export type ThisOrThatChoice = 'left' | 'right';

export type ThisOrThatCategoryFilter = ThisOrThatCategory | 'mixed';
export type ThisOrThatRoundCount = 5 | 10 | 20 | 'endless';
export type ThisOrThatVoteSeconds = 5 | 10 | 15 | 0;
export type ThisOrThatVoteVisibility = 'public' | 'anonymous';

export type ThisOrThatSettings = {
  category: ThisOrThatCategoryFilter;
  roundCount: ThisOrThatRoundCount;
  voteSeconds: ThisOrThatVoteSeconds;
  voteVisibility: ThisOrThatVoteVisibility;
};

export const DEFAULT_THIS_OR_THAT_SETTINGS: ThisOrThatSettings = {
  category: 'mixed',
  roundCount: 10,
  voteSeconds: 10,
  voteVisibility: 'public',
};

export type ThisOrThatRoundStatus = 'voting' | 'revealing' | 'complete';

export type ThisOrThatRound = {
  prompt: ThisOrThatPrompt;
  status: ThisOrThatRoundStatus;
  voterOrder: string[];
  currentVoterIndex: number;
  votes: Record<string, ThisOrThatChoice>;
  pendingChoice: ThisOrThatChoice | null;
  startedAt: number;
};

export type ThisOrThatHistoryEntry = { prompt: ThisOrThatPrompt; votes: Record<string, ThisOrThatChoice> };

export type ThisOrThatPhase = 'setup' | 'playing' | 'summary';

export type ThisOrThatGameState = {
  phase: ThisOrThatPhase;
  settings: ThisOrThatSettings;
  voters: ThisOrThatVoter[];
  usedPromptIds: string[];
  roundsPlayed: number;
  round: ThisOrThatRound | null;
  history: ThisOrThatHistoryEntry[];
};

export type ThisOrThatAction =
  | { type: 'START_SESSION'; settings: ThisOrThatSettings; voters: ThisOrThatVoter[]; now: number }
  | { type: 'SELECT_CHOICE'; voterId: string; choice: ThisOrThatChoice }
  | { type: 'CONFIRM_VOTE'; voterId: string }
  | { type: 'SKIP_CURRENT_VOTER' }
  | { type: 'TIMER_EXPIRED' }
  | { type: 'NEXT_ROUND'; now: number }
  | { type: 'RESTART'; now: number }
  | { type: 'REMOVE_VOTER'; voterId: string }
  | { type: 'BACK_TO_SETUP' };

export type ThisOrThatActionError =
  | 'not-voting'
  | 'not-your-turn'
  | 'duplicate-vote'
  | 'invalid-choice'
  | 'no-selection'
  | 'no-round'
  | 'no-voters';

export type ThisOrThatActionResult = { state: ThisOrThatGameState; error?: ThisOrThatActionError };

export type ThisOrThatResult = {
  leftCount: number;
  rightCount: number;
  totalVotes: number;
  leftPct: number;
  rightPct: number;
  isTie: boolean;
  isUnanimous: boolean;
};

export type ThisOrThatSessionSummary = {
  mostDivisive: ThisOrThatHistoryEntry | null;
  biggestAgreement: ThisOrThatHistoryEntry | null;
  similarity: Record<string, number>;
};

export { type ThisOrThatCategory, type ThisOrThatPrompt };
