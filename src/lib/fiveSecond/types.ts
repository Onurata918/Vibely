import type { FiveSecondCategory, FiveSecondChallenge, FiveSecondDifficulty } from './fiveSecondChallenges';

export type FiveSecondVoter = { id: string; name: string; c1: string; c2: string };

export type FiveSecondDifficultyFilter = FiveSecondDifficulty | 'mixed';
export type FiveSecondCategoryFilter = FiveSecondCategory | 'mixed';
export type FiveSecondRoundCount = 5 | 10 | 20 | 'endless';
export type FiveSecondJudgeMode = 'group' | 'host';
export type FiveSecondReadyCountdown = 3 | 1 | 0;

export type FiveSecondSettings = {
  difficulty: FiveSecondDifficultyFilter;
  category: FiveSecondCategoryFilter;
  roundCount: FiveSecondRoundCount;
  judgeMode: FiveSecondJudgeMode;
  scoring: boolean;
  readyCountdown: FiveSecondReadyCountdown;
};

export const DEFAULT_FIVE_SECOND_SETTINGS: FiveSecondSettings = {
  difficulty: 'mixed',
  category: 'mixed',
  roundCount: 10,
  judgeMode: 'group',
  scoring: true,
  readyCountdown: 3,
};

export const ANSWER_SECONDS = 5;

export type FiveSecondRoundStatus = 'ready' | 'answering' | 'judging' | 'revealing' | 'complete';

export type FiveSecondRound = {
  challenge: FiveSecondChallenge;
  activePlayerId: string;
  status: FiveSecondRoundStatus;
  readyStartsAt: number;
  readyEndsAt: number;
  answerStartsAt?: number;
  answerEndsAt?: number;
  judgeOrder: string[];
  judgeIndex: number;
  votes: Record<string, boolean>;
  result: boolean | null;
};

export type FiveSecondHistoryEntry = { challenge: FiveSecondChallenge; activePlayerId: string; success: boolean };

export type FiveSecondPhase = 'setup' | 'playing' | 'summary';

export type FiveSecondGameState = {
  phase: FiveSecondPhase;
  settings: FiveSecondSettings;
  voters: FiveSecondVoter[];
  usedChallengeIds: string[];
  rotationQueue: string[];
  roundsPlayed: number;
  round: FiveSecondRound | null;
  history: FiveSecondHistoryEntry[];
};

export type FiveSecondAction =
  | { type: 'START_SESSION'; settings: FiveSecondSettings; voters: FiveSecondVoter[]; now: number }
  | { type: 'READY_DONE'; now: number }
  | { type: 'ANSWER_TIMEOUT' }
  | { type: 'SUBMIT_JUDGEMENT'; voterId: string; success: boolean }
  | { type: 'HOST_JUDGE'; success: boolean }
  | { type: 'NEXT_ROUND'; now: number }
  | { type: 'RESTART'; now: number }
  | { type: 'REMOVE_VOTER'; voterId: string }
  | { type: 'BACK_TO_SETUP' };

export type FiveSecondActionError =
  | 'wrong-phase'
  | 'wrong-mode'
  | 'not-your-turn'
  | 'duplicate-vote'
  | 'self-judge'
  | 'no-voters';

export type FiveSecondActionResult = { state: FiveSecondGameState; error?: FiveSecondActionError };

export type FiveSecondPlayerStats = { voter: FiveSecondVoter; attempts: number; successes: number; successRate: number };

export { type FiveSecondCategory, type FiveSecondChallenge, type FiveSecondDifficulty };
