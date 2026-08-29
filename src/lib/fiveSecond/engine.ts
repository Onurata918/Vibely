import { getRandomFiveSecondChallenge, type FiveSecondChallenge } from './fiveSecondChallenges';
import {
  ANSWER_SECONDS,
  DEFAULT_FIVE_SECOND_SETTINGS,
  type FiveSecondAction,
  type FiveSecondActionResult,
  type FiveSecondGameState,
  type FiveSecondPlayerStats,
  type FiveSecondRound,
} from './types';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createInitialState(): FiveSecondGameState {
  return {
    phase: 'setup',
    settings: DEFAULT_FIVE_SECOND_SETTINGS,
    voters: [],
    usedChallengeIds: [],
    rotationQueue: [],
    roundsPlayed: 0,
    round: null,
    history: [],
  };
}

function pickChallenge(state: FiveSecondGameState): { challenge: FiveSecondChallenge; usedChallengeIds: string[] } | null {
  const category = state.settings.category === 'mixed' ? undefined : state.settings.category;

  let difficulty = state.settings.difficulty === 'mixed' ? undefined : state.settings.difficulty;
  if (state.settings.difficulty === 'mixed') {
    // Weighted mix so the session has rhythm instead of uniform randomness: ~25% easy, ~55% medium, ~20% hard/chaos.
    const roll = Math.random();
    difficulty = roll < 0.25 ? 'easy' : roll < 0.8 ? 'medium' : Math.random() < 0.5 ? 'hard' : 'chaos';
  }

  let challenge = getRandomFiveSecondChallenge(difficulty, category, state.usedChallengeIds);
  let usedChallengeIds = state.usedChallengeIds;
  if (!challenge) {
    // The weighted tier has no unused (or no) questions left within the category
    // filter — relax the difficulty constraint so we still avoid repeating any
    // question that's still fresh elsewhere in the category before considering
    // the whole pool exhausted.
    challenge = getRandomFiveSecondChallenge(undefined, category, state.usedChallengeIds);
  }
  if (!challenge) {
    // The entire category-filtered pool is exhausted — start a fresh no-repeat cycle.
    challenge = getRandomFiveSecondChallenge(undefined, category, []);
    usedChallengeIds = [];
  }
  if (!challenge) return null;
  return { challenge, usedChallengeIds: [...usedChallengeIds, challenge.id] };
}

function nextActivePlayer(state: FiveSecondGameState): { activePlayerId: string; rotationQueue: string[] } | null {
  if (state.voters.length === 0) return null;
  let queue = state.rotationQueue.filter((id) => state.voters.some((v) => v.id === id));
  if (queue.length === 0) queue = shuffle(state.voters.map((v) => v.id));
  const [activePlayerId, ...rest] = queue;
  return { activePlayerId, rotationQueue: rest };
}

function startRound(state: FiveSecondGameState, now: number): FiveSecondGameState {
  if (state.voters.length < 2) return { ...state, phase: 'summary', round: null };
  const picked = pickChallenge(state);
  const player = nextActivePlayer(state);
  if (!picked || !player) return { ...state, phase: 'summary', round: null };

  const readyMs = state.settings.readyCountdown * 1000;
  const round: FiveSecondRound = {
    challenge: picked.challenge,
    activePlayerId: player.activePlayerId,
    status: 'ready',
    readyStartsAt: now,
    readyEndsAt: now + readyMs,
    judgeOrder: state.voters.map((v) => v.id).filter((id) => id !== player.activePlayerId),
    judgeIndex: 0,
    votes: {},
    result: null,
  };
  return { ...state, phase: 'playing', usedChallengeIds: picked.usedChallengeIds, rotationQueue: player.rotationQueue, round };
}

function computeJudgement(round: FiveSecondRound): boolean {
  const votes = Object.values(round.votes);
  const successVotes = votes.filter(Boolean).length;
  const failVotes = votes.length - successVotes;
  if (successVotes === failVotes) return false; // tie -> "Not quite"
  return successVotes > failVotes;
}

export function fiveSecondReducer(state: FiveSecondGameState, action: FiveSecondAction): FiveSecondActionResult {
  switch (action.type) {
    case 'START_SESSION': {
      if (action.voters.length === 0) return { state, error: 'no-voters' };
      const base: FiveSecondGameState = {
        phase: 'setup',
        settings: action.settings,
        voters: action.voters,
        usedChallengeIds: [],
        rotationQueue: [],
        roundsPlayed: 0,
        round: null,
        history: [],
      };
      return { state: startRound(base, action.now) };
    }

    case 'READY_DONE': {
      const round = state.round;
      if (!round || round.status !== 'ready') return { state, error: 'wrong-phase' };
      return {
        state: {
          ...state,
          round: { ...round, status: 'answering', answerStartsAt: action.now, answerEndsAt: action.now + ANSWER_SECONDS * 1000 },
        },
      };
    }

    case 'ANSWER_TIMEOUT': {
      const round = state.round;
      if (!round || round.status !== 'answering') return { state, error: 'wrong-phase' };
      return { state: { ...state, round: { ...round, status: 'judging' } } };
    }

    case 'SUBMIT_JUDGEMENT': {
      const round = state.round;
      if (!round || round.status !== 'judging') return { state, error: 'wrong-phase' };
      if (state.settings.judgeMode !== 'group') return { state, error: 'wrong-mode' };
      if (action.voterId === round.activePlayerId) return { state, error: 'self-judge' };
      const currentJudgeId = round.judgeOrder[round.judgeIndex];
      if (!currentJudgeId) return { state, error: 'wrong-phase' };
      if (currentJudgeId !== action.voterId) return { state, error: 'not-your-turn' };
      if (action.voterId in round.votes) return { state, error: 'duplicate-vote' };

      const votes = { ...round.votes, [action.voterId]: action.success };
      const judgeIndex = round.judgeIndex + 1;
      const allJudged = judgeIndex >= round.judgeOrder.length;
      const newRound: FiveSecondRound = { ...round, votes, judgeIndex, status: allJudged ? 'revealing' : 'judging' };
      if (allJudged) newRound.result = computeJudgement(newRound);
      return { state: { ...state, round: newRound } };
    }

    case 'HOST_JUDGE': {
      const round = state.round;
      if (!round || round.status !== 'judging') return { state, error: 'wrong-phase' };
      if (state.settings.judgeMode !== 'host') return { state, error: 'wrong-mode' };
      return { state: { ...state, round: { ...round, status: 'revealing', result: action.success } } };
    }

    case 'NEXT_ROUND': {
      const finishedRound = state.round;
      const history =
        finishedRound && finishedRound.result !== null
          ? [...state.history, { challenge: finishedRound.challenge, activePlayerId: finishedRound.activePlayerId, success: finishedRound.result }]
          : state.history;
      const roundsPlayed = state.roundsPlayed + 1;
      const reachedLimit = state.settings.roundCount !== 'endless' && roundsPlayed >= state.settings.roundCount;
      const cleared: FiveSecondGameState = { ...state, history, roundsPlayed, round: null };
      if (reachedLimit) return { state: { ...cleared, phase: 'summary' } };
      return { state: startRound(cleared, action.now) };
    }

    case 'RESTART': {
      const fresh: FiveSecondGameState = { ...state, usedChallengeIds: [], rotationQueue: [], roundsPlayed: 0, round: null, history: [] };
      return { state: startRound(fresh, action.now) };
    }

    case 'REMOVE_VOTER': {
      const voters = state.voters.filter((v) => v.id !== action.voterId);
      const rotationQueue = state.rotationQueue.filter((id) => id !== action.voterId);
      if (voters.length < 2) return { state: { ...state, voters, rotationQueue, phase: 'summary', round: null } };

      const round = state.round;
      if (!round) return { state: { ...state, voters, rotationQueue } };

      if (round.activePlayerId === action.voterId) {
        // The active player left mid-round — abandon this round (no result to score) and move on.
        return { state: startRound({ ...state, voters, rotationQueue, round: null }, Date.now()) };
      }

      const removedIdx = round.judgeOrder.indexOf(action.voterId);
      if (removedIdx === -1) return { state: { ...state, voters, rotationQueue } };
      const alreadyVoted = action.voterId in round.votes;
      const judgeOrder = round.judgeOrder.filter((id) => id !== action.voterId);
      let judgeIndex = round.judgeIndex;
      if (removedIdx < judgeIndex || (removedIdx === judgeIndex && alreadyVoted)) judgeIndex -= 1;
      const allJudged = round.status === 'judging' && judgeIndex >= judgeOrder.length;
      const newRound: FiveSecondRound = { ...round, judgeOrder, judgeIndex, status: allJudged ? 'revealing' : round.status };
      if (allJudged) newRound.result = computeJudgement(newRound);
      return { state: { ...state, voters, rotationQueue, round: newRound } };
    }

    case 'BACK_TO_SETUP':
      return { state: { ...state, phase: 'setup', round: null, usedChallengeIds: [], rotationQueue: [], roundsPlayed: 0, history: [] } };

    default:
      return { state };
  }
}

export function computeSessionStats(state: FiveSecondGameState): FiveSecondPlayerStats[] {
  return state.voters.map((voter) => {
    const attempts = state.history.filter((h) => h.activePlayerId === voter.id).length;
    const successes = state.history.filter((h) => h.activePlayerId === voter.id && h.success).length;
    return { voter, attempts, successes, successRate: attempts > 0 ? Math.round((successes / attempts) * 100) : 0 };
  });
}

export function challengeText(challenge: FiveSecondChallenge, language: 'en' | 'tr'): string {
  return language === 'tr' ? challenge.tr : challenge.en;
}
