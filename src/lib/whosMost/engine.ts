import { getRandomMostLikelyQuestion, type MostLikelyQuestion } from './mostLikelyQuestions';
import {
  DEFAULT_WHOS_MOST_SETTINGS,
  type WhosMostAction,
  type WhosMostActionResult,
  type WhosMostGameState,
  type WhosMostResult,
  type WhosMostRound,
} from './types';

export function createInitialState(): WhosMostGameState {
  return {
    phase: 'setup',
    settings: DEFAULT_WHOS_MOST_SETTINGS,
    voters: [],
    askedQuestionIds: [],
    questionsPlayed: 0,
    round: null,
  };
}

function pickNextQuestion(state: WhosMostGameState): { question: MostLikelyQuestion; askedQuestionIds: string[] } | null {
  const category = state.settings.category === 'mixed' ? undefined : state.settings.category;
  let question = getRandomMostLikelyQuestion(category, state.askedQuestionIds);
  let askedQuestionIds = state.askedQuestionIds;
  if (!question) {
    // Pool exhausted for this category — start a fresh no-repeat cycle.
    question = getRandomMostLikelyQuestion(category, []);
    askedQuestionIds = [];
  }
  if (!question) return null;
  return { question, askedQuestionIds: [...askedQuestionIds, question.id] };
}

function startRound(state: WhosMostGameState, now: number): WhosMostGameState {
  if (state.voters.length === 0) return { ...state, phase: 'summary', round: null };
  const picked = pickNextQuestion(state);
  if (!picked) return { ...state, phase: 'summary', round: null };
  const round: WhosMostRound = {
    question: picked.question,
    status: 'voting',
    voterOrder: state.voters.map((v) => v.id),
    currentVoterIndex: 0,
    votes: {},
    startedAt: now,
  };
  return { ...state, phase: 'playing', askedQuestionIds: picked.askedQuestionIds, round };
}

function advanceOrReveal(round: WhosMostRound, nextIndex: number): WhosMostRound {
  const allDone = nextIndex >= round.voterOrder.length;
  return { ...round, currentVoterIndex: nextIndex, status: allDone ? 'revealing' : 'voting' };
}

export function whosMostReducer(state: WhosMostGameState, action: WhosMostAction): WhosMostActionResult {
  switch (action.type) {
    case 'START_SESSION': {
      if (action.voters.length === 0) return { state, error: 'no-voters' };
      const base: WhosMostGameState = {
        phase: 'setup',
        settings: action.settings,
        voters: action.voters,
        askedQuestionIds: [],
        questionsPlayed: 0,
        round: null,
      };
      return { state: startRound(base, action.now) };
    }

    case 'SUBMIT_VOTE': {
      const round = state.round;
      if (!round || round.status !== 'voting') return { state, error: 'not-voting' };
      const currentVoterId = round.voterOrder[round.currentVoterIndex];
      if (!currentVoterId) return { state, error: 'not-voting' };
      if (currentVoterId !== action.voterId) return { state, error: 'not-your-turn' };
      if (action.voterId in round.votes) return { state, error: 'duplicate-vote' };
      if (!state.settings.selfVoteEnabled && action.voterId === action.targetId) return { state, error: 'self-vote-disabled' };
      if (!state.voters.some((v) => v.id === action.targetId)) return { state, error: 'invalid-target' };

      const votes = { ...round.votes, [action.voterId]: action.targetId };
      const newRound = advanceOrReveal({ ...round, votes }, round.currentVoterIndex + 1);
      return { state: { ...state, round: newRound } };
    }

    case 'SKIP_CURRENT_VOTER':
    case 'TIMER_EXPIRED': {
      const round = state.round;
      if (!round || round.status !== 'voting') return { state, error: 'not-voting' };
      const newRound = advanceOrReveal(round, round.currentVoterIndex + 1);
      return { state: { ...state, round: newRound } };
    }

    case 'NEXT_QUESTION': {
      const questionsPlayed = state.questionsPlayed + 1;
      const reachedLimit = state.settings.questionCount !== 'endless' && questionsPlayed >= state.settings.questionCount;
      const cleared: WhosMostGameState = { ...state, questionsPlayed, round: null };
      if (reachedLimit) return { state: { ...cleared, phase: 'summary' } };
      return { state: startRound(cleared, action.now) };
    }

    case 'RESTART': {
      const fresh: WhosMostGameState = { ...state, askedQuestionIds: [], questionsPlayed: 0, round: null };
      return { state: startRound(fresh, action.now) };
    }

    case 'REMOVE_VOTER': {
      const voters = state.voters.filter((v) => v.id !== action.voterId);
      const round = state.round;
      if (!round) return { state: { ...state, voters } };

      const removedIdx = round.voterOrder.indexOf(action.voterId);
      if (removedIdx === -1) return { state: { ...state, voters } };

      const alreadyVoted = action.voterId in round.votes;
      const voterOrder = round.voterOrder.filter((id) => id !== action.voterId);
      let currentVoterIndex = round.currentVoterIndex;
      if (removedIdx < currentVoterIndex || (removedIdx === currentVoterIndex && alreadyVoted)) {
        currentVoterIndex -= 1;
      }
      const status = round.status === 'voting' && currentVoterIndex >= voterOrder.length ? 'revealing' : round.status;
      return { state: { ...state, voters, round: { ...round, voterOrder, currentVoterIndex, status } } };
    }

    case 'BACK_TO_SETUP':
      return { state: { ...state, phase: 'setup', round: null, askedQuestionIds: [], questionsPlayed: 0 } };

    default:
      return { state };
  }
}

export function computeWhosMostResult(round: WhosMostRound): WhosMostResult {
  const tally: Record<string, number> = {};
  for (const targetId of Object.values(round.votes)) {
    tally[targetId] = (tally[targetId] ?? 0) + 1;
  }
  let maxVotes = 0;
  for (const count of Object.values(tally)) maxVotes = Math.max(maxVotes, count);
  const winnerIds = maxVotes > 0 ? Object.entries(tally).filter(([, c]) => c === maxVotes).map(([id]) => id) : [];
  return { winnerIds, maxVotes, isTie: winnerIds.length > 1, tally };
}

export function questionText(question: MostLikelyQuestion, language: 'en' | 'tr'): string {
  return language === 'tr' ? question.tr : question.en;
}
