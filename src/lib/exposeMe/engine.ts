import { getRandomExposeMeQuestion, type ExposeMeIntensity, type ExposeMeQuestion } from './exposeMeQuestions';
import { DEFAULT_EXPOSE_ME_SETTINGS, type ExposeMeAction, type ExposeMeActionResult, type ExposeMeGameState, type ExposeMeRound } from './types';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createInitialState(): ExposeMeGameState {
  return {
    phase: 'setup',
    settings: DEFAULT_EXPOSE_ME_SETTINGS,
    voters: [],
    usedQuestionIds: [],
    rotationQueue: [],
    roundsPlayed: 0,
    skipStreak: 0,
    round: null,
    history: [],
  };
}

// Picks which intensity tier to draw from for this round. "Soft" always
// stays soft. "Bold" leans spicy but still mostly balanced/soft. "Balanced"
// (default) leans gentle with occasional bold. After 2+ consecutive skips
// we temporarily avoid "bold" regardless of setting, per the spec's request
// to ease off high-intensity prompts after repeated skips.
function rollIntensity(setting: ExposeMeIntensity, avoidBold: boolean): ExposeMeIntensity {
  if (setting === 'soft') return 'soft';
  if (avoidBold) return Math.random() < 0.5 ? 'soft' : 'balanced';
  const r = Math.random();
  if (setting === 'bold') return r < 0.2 ? 'soft' : r < 0.5 ? 'balanced' : 'bold';
  return r < 0.35 ? 'soft' : r < 0.8 ? 'balanced' : 'bold'; // balanced setting
}

function pickQuestion(state: ExposeMeGameState): { question: ExposeMeQuestion; usedQuestionIds: string[] } | null {
  const category = state.settings.category === 'mixed' ? undefined : state.settings.category;
  const intensity = rollIntensity(state.settings.intensity, state.skipStreak >= 2);

  let question = getRandomExposeMeQuestion(category, intensity, state.usedQuestionIds);
  let usedQuestionIds = state.usedQuestionIds;
  if (!question) {
    // This intensity tier has nothing left within the category filter —
    // relax the intensity constraint before considering the whole pool exhausted.
    question = getRandomExposeMeQuestion(category, undefined, state.usedQuestionIds);
  }
  if (!question) {
    // The entire category-filtered pool is exhausted — start a fresh no-repeat cycle.
    question = getRandomExposeMeQuestion(category, undefined, []);
    usedQuestionIds = [];
  }
  if (!question) return null;
  return { question, usedQuestionIds: [...usedQuestionIds, question.id] };
}

function nextActivePlayer(state: ExposeMeGameState): { activePlayerId: string; rotationQueue: string[] } | null {
  if (state.voters.length === 0) return null;
  let queue = state.rotationQueue.filter((id) => state.voters.some((v) => v.id === id));
  if (queue.length === 0) queue = shuffle(state.voters.map((v) => v.id));
  const [activePlayerId, ...rest] = queue;
  return { activePlayerId, rotationQueue: rest };
}

function startRound(state: ExposeMeGameState): ExposeMeGameState {
  if (state.voters.length < 2) return { ...state, phase: 'summary', round: null };
  const picked = pickQuestion(state);
  const player = nextActivePlayer(state);
  if (!picked || !player) return { ...state, phase: 'summary', round: null };

  const round: ExposeMeRound = { question: picked.question, activePlayerId: player.activePlayerId, status: 'showing' };
  return { ...state, phase: 'playing', usedQuestionIds: picked.usedQuestionIds, rotationQueue: player.rotationQueue, round };
}

export function exposeMeReducer(state: ExposeMeGameState, action: ExposeMeAction): ExposeMeActionResult {
  switch (action.type) {
    case 'START_SESSION': {
      if (action.voters.length === 0) return { state, error: 'no-voters' };
      const base: ExposeMeGameState = {
        phase: 'setup',
        settings: action.settings,
        voters: action.voters,
        usedQuestionIds: [],
        rotationQueue: [],
        roundsPlayed: 0,
        skipStreak: 0,
        round: null,
        history: [],
      };
      return { state: startRound(base) };
    }

    case 'MARK_ANSWERED': {
      const round = state.round;
      if (!round || round.status !== 'showing') return { state, error: 'wrong-phase' };
      return { state: { ...state, round: { ...round, status: 'answered' } } };
    }

    case 'SKIP_QUESTION': {
      const round = state.round;
      if (!round || round.status !== 'showing') return { state, error: 'wrong-phase' };
      return { state: { ...state, round: { ...round, status: 'skipped' } } };
    }

    case 'NEXT_ROUND': {
      const finished = state.round;
      const history =
        finished && finished.status !== 'showing' ? [...state.history, { question: finished.question, activePlayerId: finished.activePlayerId, status: finished.status }] : state.history;
      const skipStreak = finished?.status === 'skipped' ? state.skipStreak + 1 : 0;
      const roundsPlayed = state.roundsPlayed + (finished ? 1 : 0);
      const reachedLimit = state.settings.roundCount !== 'endless' && roundsPlayed >= state.settings.roundCount;
      const cleared: ExposeMeGameState = { ...state, history, skipStreak, roundsPlayed, round: null };
      if (reachedLimit) return { state: { ...cleared, phase: 'summary' } };
      return { state: startRound(cleared) };
    }

    case 'RESTART': {
      const fresh: ExposeMeGameState = { ...state, usedQuestionIds: [], rotationQueue: [], roundsPlayed: 0, skipStreak: 0, round: null, history: [] };
      return { state: startRound(fresh) };
    }

    case 'REMOVE_VOTER': {
      const voters = state.voters.filter((v) => v.id !== action.voterId);
      const rotationQueue = state.rotationQueue.filter((id) => id !== action.voterId);
      if (voters.length < 2) return { state: { ...state, voters, rotationQueue, phase: 'summary', round: null } };

      const round = state.round;
      if (round && round.activePlayerId === action.voterId) {
        // The active player left mid-round — abandon this round (nothing to record) and move on.
        return { state: startRound({ ...state, voters, rotationQueue, round: null }) };
      }
      return { state: { ...state, voters, rotationQueue } };
    }

    case 'BACK_TO_SETUP':
      return { state: { ...state, phase: 'setup', round: null, usedQuestionIds: [], rotationQueue: [], roundsPlayed: 0, skipStreak: 0, history: [] } };

    default:
      return { state };
  }
}

export function questionText(question: ExposeMeQuestion, language: 'en' | 'tr'): string {
  return language === 'tr' ? question.tr : question.en;
}
