import { getRandomThisOrThatPrompt, type ThisOrThatPrompt } from './thisOrThatPrompts';
import {
  DEFAULT_THIS_OR_THAT_SETTINGS,
  type ThisOrThatAction,
  type ThisOrThatActionResult,
  type ThisOrThatGameState,
  type ThisOrThatResult,
  type ThisOrThatRound,
  type ThisOrThatSessionSummary,
} from './types';

export function createInitialState(): ThisOrThatGameState {
  return {
    phase: 'setup',
    settings: DEFAULT_THIS_OR_THAT_SETTINGS,
    voters: [],
    usedPromptIds: [],
    roundsPlayed: 0,
    round: null,
    history: [],
  };
}

function pickNextPrompt(state: ThisOrThatGameState): { prompt: ThisOrThatPrompt; usedPromptIds: string[] } | null {
  const category = state.settings.category === 'mixed' ? undefined : state.settings.category;
  let prompt = getRandomThisOrThatPrompt(category, state.usedPromptIds);
  let usedPromptIds = state.usedPromptIds;
  if (!prompt) {
    // Pool exhausted for this category — start a fresh no-repeat cycle.
    prompt = getRandomThisOrThatPrompt(category, []);
    usedPromptIds = [];
  }
  if (!prompt) return null;
  return { prompt, usedPromptIds: [...usedPromptIds, prompt.id] };
}

function startRound(state: ThisOrThatGameState, now: number): ThisOrThatGameState {
  if (state.voters.length === 0) return { ...state, phase: 'summary', round: null };
  const picked = pickNextPrompt(state);
  if (!picked) return { ...state, phase: 'summary', round: null };
  const round: ThisOrThatRound = {
    prompt: picked.prompt,
    status: 'voting',
    voterOrder: state.voters.map((v) => v.id),
    currentVoterIndex: 0,
    votes: {},
    pendingChoice: null,
    startedAt: now,
  };
  return { ...state, phase: 'playing', usedPromptIds: picked.usedPromptIds, round };
}

function advanceOrReveal(round: ThisOrThatRound, nextIndex: number): ThisOrThatRound {
  const allDone = nextIndex >= round.voterOrder.length;
  return { ...round, currentVoterIndex: nextIndex, pendingChoice: null, status: allDone ? 'revealing' : 'voting' };
}

export function thisOrThatReducer(state: ThisOrThatGameState, action: ThisOrThatAction): ThisOrThatActionResult {
  switch (action.type) {
    case 'START_SESSION': {
      if (action.voters.length === 0) return { state, error: 'no-voters' };
      const base: ThisOrThatGameState = {
        phase: 'setup',
        settings: action.settings,
        voters: action.voters,
        usedPromptIds: [],
        roundsPlayed: 0,
        round: null,
        history: [],
      };
      return { state: startRound(base, action.now) };
    }

    case 'SELECT_CHOICE': {
      const round = state.round;
      if (!round || round.status !== 'voting') return { state, error: 'not-voting' };
      const currentVoterId = round.voterOrder[round.currentVoterIndex];
      if (!currentVoterId) return { state, error: 'not-voting' };
      if (currentVoterId !== action.voterId) return { state, error: 'not-your-turn' };
      if (action.voterId in round.votes) return { state, error: 'duplicate-vote' };
      return { state: { ...state, round: { ...round, pendingChoice: action.choice } } };
    }

    case 'CONFIRM_VOTE': {
      const round = state.round;
      if (!round || round.status !== 'voting') return { state, error: 'not-voting' };
      const currentVoterId = round.voterOrder[round.currentVoterIndex];
      if (!currentVoterId) return { state, error: 'not-voting' };
      if (currentVoterId !== action.voterId) return { state, error: 'not-your-turn' };
      if (action.voterId in round.votes) return { state, error: 'duplicate-vote' };
      if (!round.pendingChoice) return { state, error: 'no-selection' };

      const votes = { ...round.votes, [action.voterId]: round.pendingChoice };
      const newRound = advanceOrReveal({ ...round, votes }, round.currentVoterIndex + 1);
      return { state: { ...state, round: newRound } };
    }

    case 'SKIP_CURRENT_VOTER': {
      const round = state.round;
      if (!round || round.status !== 'voting') return { state, error: 'not-voting' };
      const newRound = advanceOrReveal(round, round.currentVoterIndex + 1);
      return { state: { ...state, round: newRound } };
    }

    case 'TIMER_EXPIRED': {
      const round = state.round;
      if (!round || round.status !== 'voting') return { state, error: 'not-voting' };
      const currentVoterId = round.voterOrder[round.currentVoterIndex];
      // If the current voter had already picked a side, lock it in instead of discarding it.
      const votes = round.pendingChoice && currentVoterId ? { ...round.votes, [currentVoterId]: round.pendingChoice } : round.votes;
      const newRound = advanceOrReveal({ ...round, votes }, round.currentVoterIndex + 1);
      return { state: { ...state, round: newRound } };
    }

    case 'NEXT_ROUND': {
      const finishedRound = state.round;
      const history = finishedRound ? [...state.history, { prompt: finishedRound.prompt, votes: finishedRound.votes }] : state.history;
      const roundsPlayed = state.roundsPlayed + 1;
      const reachedLimit = state.settings.roundCount !== 'endless' && roundsPlayed >= state.settings.roundCount;
      const cleared: ThisOrThatGameState = { ...state, history, roundsPlayed, round: null };
      if (reachedLimit) return { state: { ...cleared, phase: 'summary' } };
      return { state: startRound(cleared, action.now) };
    }

    case 'RESTART': {
      const fresh: ThisOrThatGameState = { ...state, usedPromptIds: [], roundsPlayed: 0, round: null, history: [] };
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
      let pendingChoice = round.pendingChoice;
      if (removedIdx < currentVoterIndex || (removedIdx === currentVoterIndex && alreadyVoted)) {
        currentVoterIndex -= 1;
      }
      if (removedIdx === currentVoterIndex && !alreadyVoted) {
        pendingChoice = null;
      }
      const status = round.status === 'voting' && currentVoterIndex >= voterOrder.length ? 'revealing' : round.status;
      return { state: { ...state, voters, round: { ...round, voterOrder, currentVoterIndex, pendingChoice, status } } };
    }

    case 'BACK_TO_SETUP':
      return { state: { ...state, phase: 'setup', round: null, usedPromptIds: [], roundsPlayed: 0, history: [] } };

    default:
      return { state };
  }
}

export function computeThisOrThatResult(round: ThisOrThatRound): ThisOrThatResult {
  let leftCount = 0;
  let rightCount = 0;
  for (const choice of Object.values(round.votes)) {
    if (choice === 'left') leftCount++;
    else rightCount++;
  }
  const totalVotes = leftCount + rightCount;
  const leftPct = totalVotes > 0 ? Math.round((leftCount / totalVotes) * 100) : 0;
  const rightPct = totalVotes > 0 ? 100 - leftPct : 0;
  const isTie = totalVotes > 0 && leftCount === rightCount;
  const isUnanimous = totalVotes > 0 && (leftCount === 0 || rightCount === 0);
  return { leftCount, rightCount, totalVotes, leftPct, rightPct, isTie, isUnanimous };
}

function entryLeftPct(entry: { votes: Record<string, 'left' | 'right'> }): number | null {
  const values = Object.values(entry.votes);
  if (values.length === 0) return null;
  const left = values.filter((c) => c === 'left').length;
  return (left / values.length) * 100;
}

export function computeSessionSummary(state: ThisOrThatGameState): ThisOrThatSessionSummary {
  let mostDivisive: ThisOrThatGameState['history'][number] | null = null;
  let mostDivisiveDelta = Infinity;
  let biggestAgreement: ThisOrThatGameState['history'][number] | null = null;
  let biggestAgreementDelta = -Infinity;

  for (const entry of state.history) {
    const leftPct = entryLeftPct(entry);
    if (leftPct === null) continue;
    const delta = Math.abs(leftPct - 50);
    if (delta < mostDivisiveDelta) {
      mostDivisiveDelta = delta;
      mostDivisive = entry;
    }
    if (delta > biggestAgreementDelta) {
      biggestAgreementDelta = delta;
      biggestAgreement = entry;
    }
  }

  const similarity: Record<string, number> = {};
  for (const voter of state.voters) {
    let matched = 0;
    let counted = 0;
    for (const entry of state.history) {
      const choice = entry.votes[voter.id];
      if (!choice) continue;
      const values = Object.values(entry.votes);
      const left = values.filter((c) => c === 'left').length;
      const total = values.length;
      const majority = left * 2 > total ? 'left' : left * 2 < total ? 'right' : null;
      if (majority === null) continue;
      counted++;
      if (choice === majority) matched++;
    }
    similarity[voter.id] = counted > 0 ? Math.round((matched / counted) * 100) : 0;
  }

  return { mostDivisive, biggestAgreement, similarity };
}

export function promptText(prompt: ThisOrThatPrompt, side: 'left' | 'right', language: 'en' | 'tr'): string {
  return language === 'tr' ? prompt[side].tr : prompt[side].en;
}
