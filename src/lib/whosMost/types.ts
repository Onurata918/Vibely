import type { MostLikelyCategory, MostLikelyQuestion } from './mostLikelyQuestions';

export type WhosMostVoter = { id: string; name: string; c1: string; c2: string };

export type WhosMostCategoryFilter = MostLikelyCategory | 'mixed';
export type WhosMostQuestionCount = 5 | 10 | 'endless';
export type WhosMostVoteSeconds = 10 | 15 | 20 | 0;

export type WhosMostSettings = {
  category: WhosMostCategoryFilter;
  questionCount: WhosMostQuestionCount;
  voteSeconds: WhosMostVoteSeconds;
  selfVoteEnabled: boolean;
  anonymous: boolean;
};

export type WhosMostRoundStatus = 'voting' | 'revealing' | 'complete';

export type WhosMostRound = {
  question: MostLikelyQuestion;
  status: WhosMostRoundStatus;
  voterOrder: string[];
  currentVoterIndex: number;
  votes: Record<string, string>;
  startedAt: number;
};

export type WhosMostPhase = 'setup' | 'playing' | 'summary';

export type WhosMostGameState = {
  phase: WhosMostPhase;
  settings: WhosMostSettings;
  voters: WhosMostVoter[];
  askedQuestionIds: string[];
  questionsPlayed: number;
  round: WhosMostRound | null;
};

export type WhosMostAction =
  | { type: 'START_SESSION'; settings: WhosMostSettings; voters: WhosMostVoter[]; now: number }
  | { type: 'SUBMIT_VOTE'; voterId: string; targetId: string }
  | { type: 'SKIP_CURRENT_VOTER' }
  | { type: 'TIMER_EXPIRED' }
  | { type: 'NEXT_QUESTION'; now: number }
  | { type: 'RESTART'; now: number }
  | { type: 'REMOVE_VOTER'; voterId: string }
  | { type: 'BACK_TO_SETUP' };

export type WhosMostActionError =
  | 'not-voting'
  | 'not-your-turn'
  | 'duplicate-vote'
  | 'self-vote-disabled'
  | 'invalid-target'
  | 'no-round'
  | 'no-voters';

export type WhosMostActionResult = { state: WhosMostGameState; error?: WhosMostActionError };

export type WhosMostResult = {
  winnerIds: string[];
  maxVotes: number;
  isTie: boolean;
  tally: Record<string, number>;
};

export const DEFAULT_WHOS_MOST_SETTINGS: WhosMostSettings = {
  category: 'mixed',
  questionCount: 10,
  voteSeconds: 15,
  selfVoteEnabled: false,
  anonymous: true,
};

export { type MostLikelyCategory, type MostLikelyQuestion };
