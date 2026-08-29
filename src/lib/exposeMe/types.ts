import type { ExposeMeCategory, ExposeMeIntensity, ExposeMeQuestion } from './exposeMeQuestions';

export type ExposeMeVoter = { id: string; name: string; c1: string; c2: string };

export type ExposeMeCategoryFilter = ExposeMeCategory | 'mixed';
export type ExposeMeRoundCount = 5 | 10 | 20 | 'endless';

export type ExposeMeSettings = {
  category: ExposeMeCategoryFilter;
  intensity: ExposeMeIntensity;
  roundCount: ExposeMeRoundCount;
};

export const DEFAULT_EXPOSE_ME_SETTINGS: ExposeMeSettings = {
  category: 'mixed',
  intensity: 'balanced',
  roundCount: 10,
};

export type ExposeMeRoundStatus = 'showing' | 'answered' | 'skipped';

export type ExposeMeRound = {
  question: ExposeMeQuestion;
  activePlayerId: string;
  status: ExposeMeRoundStatus;
};

export type ExposeMeHistoryEntry = { question: ExposeMeQuestion; activePlayerId: string; status: 'answered' | 'skipped' };

export type ExposeMePhase = 'setup' | 'playing' | 'summary';

export type ExposeMeGameState = {
  phase: ExposeMePhase;
  settings: ExposeMeSettings;
  voters: ExposeMeVoter[];
  usedQuestionIds: string[];
  rotationQueue: string[];
  roundsPlayed: number;
  skipStreak: number;
  round: ExposeMeRound | null;
  history: ExposeMeHistoryEntry[];
};

export type ExposeMeAction =
  | { type: 'START_SESSION'; settings: ExposeMeSettings; voters: ExposeMeVoter[] }
  | { type: 'MARK_ANSWERED' }
  | { type: 'SKIP_QUESTION' }
  | { type: 'NEXT_ROUND' }
  | { type: 'RESTART' }
  | { type: 'REMOVE_VOTER'; voterId: string }
  | { type: 'BACK_TO_SETUP' };

export type ExposeMeActionError = 'wrong-phase' | 'no-voters';

export type ExposeMeActionResult = { state: ExposeMeGameState; error?: ExposeMeActionError };

export { type ExposeMeCategory, type ExposeMeIntensity, type ExposeMeQuestion };
