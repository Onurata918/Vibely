import { describe, expect, it } from 'vitest';

import { computeSessionSummary, computeThisOrThatResult, createInitialState, promptText, thisOrThatReducer } from '../engine';
import { getRandomThisOrThatPrompt, THIS_OR_THAT_PROMPTS } from '../thisOrThatPrompts';
import { DEFAULT_THIS_OR_THAT_SETTINGS, type ThisOrThatSettings, type ThisOrThatVoter } from '../types';

const voters: ThisOrThatVoter[] = [
  { id: 'me', name: 'Onur', c1: '#111', c2: '#222' },
  { id: 'zeynep', name: 'Zeynep', c1: '#333', c2: '#444' },
  { id: 'mert', name: 'Mert', c1: '#555', c2: '#666' },
];

function startedState(overrides: Partial<ThisOrThatSettings> = {}, now = 1000) {
  const settings: ThisOrThatSettings = { ...DEFAULT_THIS_OR_THAT_SETTINGS, ...overrides };
  const result = thisOrThatReducer(createInitialState(), { type: 'START_SESSION', settings, voters, now });
  return result.state;
}

function vote(state: ReturnType<typeof startedState>, voterId: string, choice: 'left' | 'right') {
  let s = thisOrThatReducer(state, { type: 'SELECT_CHOICE', voterId, choice }).state;
  s = thisOrThatReducer(s, { type: 'CONFIRM_VOTE', voterId }).state;
  return s;
}

describe('prompt selection', () => {
  it('returns a random prompt from the full pool', () => {
    const p = getRandomThisOrThatPrompt();
    expect(p).not.toBeNull();
    expect(THIS_OR_THAT_PROMPTS).toContainEqual(p);
  });

  it('filters by category', () => {
    for (let i = 0; i < 30; i++) {
      const p = getRandomThisOrThatPrompt('sports');
      expect(p?.category).toBe('sports');
    }
  });

  it('picks Turkish/English text by language and side', () => {
    const p = THIS_OR_THAT_PROMPTS[0];
    expect(promptText(p, 'left', 'tr')).toBe(p.left.tr);
    expect(promptText(p, 'left', 'en')).toBe(p.left.en);
    expect(promptText(p, 'right', 'tr')).toBe(p.right.tr);
  });
});

describe('session start / category filtering', () => {
  it('starts a round with a prompt matching the chosen category', () => {
    const state = startedState({ category: 'sports' });
    expect(state.round?.prompt.category).toBe('sports');
  });

  it('rejects starting a session with no voters', () => {
    const result = thisOrThatReducer(createInitialState(), { type: 'START_SESSION', settings: DEFAULT_THIS_OR_THAT_SETTINGS, voters: [], now: 1 });
    expect(result.error).toBe('no-voters');
  });
});

describe('no repeat + pool reset', () => {
  it('never repeats a prompt until the category pool is exhausted, then resets', () => {
    // 'sports' category has 8 prompts.
    let state = startedState({ category: 'sports', roundCount: 'endless' });
    const seen = new Set<string>([state.round!.prompt.id]);
    for (let i = 0; i < 7; i++) {
      state = thisOrThatReducer(state, { type: 'NEXT_ROUND', now: 1000 + i }).state;
      const id = state.round!.prompt.id;
      expect(seen.has(id)).toBe(false);
      seen.add(id);
    }
    expect(seen.size).toBe(8);
    // Pool exhausted — the next round must reset and can reuse an earlier prompt.
    state = thisOrThatReducer(state, { type: 'NEXT_ROUND', now: 2000 }).state;
    expect(state.round).not.toBeNull();
    expect(state.usedPromptIds).toEqual([state.round!.prompt.id]);
  });
});

describe('voting: select + confirm', () => {
  it('allows changing the pending choice before confirming', () => {
    let state = startedState();
    state = thisOrThatReducer(state, { type: 'SELECT_CHOICE', voterId: 'me', choice: 'left' }).state;
    expect(state.round?.pendingChoice).toBe('left');
    state = thisOrThatReducer(state, { type: 'SELECT_CHOICE', voterId: 'me', choice: 'right' }).state;
    expect(state.round?.pendingChoice).toBe('right');
    state = thisOrThatReducer(state, { type: 'CONFIRM_VOTE', voterId: 'me' }).state;
    expect(state.round?.votes.me).toBe('right');
  });

  it('rejects confirming with no selection made', () => {
    const state = startedState();
    const result = thisOrThatReducer(state, { type: 'CONFIRM_VOTE', voterId: 'me' });
    expect(result.error).toBe('no-selection');
  });

  it('records exactly one final vote per participant via turn order', () => {
    let state = startedState();
    state = vote(state, 'me', 'left');
    expect(Object.keys(state.round!.votes)).toHaveLength(1);
    // 'me' tries to vote again after the turn moved on — rejected.
    const stale = thisOrThatReducer(state, { type: 'SELECT_CHOICE', voterId: 'me', choice: 'right' });
    expect(stale.error).toBe('not-your-turn');
  });

  it('rejects a vote once the round is no longer voting (locked after reveal)', () => {
    let state = startedState();
    for (const v of voters) state = vote(state, v.id, 'left');
    expect(state.round?.status).toBe('revealing');
    const late = thisOrThatReducer(state, { type: 'SELECT_CHOICE', voterId: 'me', choice: 'right' });
    expect(late.error).toBe('not-voting');
  });

  it('reveals early once every voter has voted', () => {
    let state = startedState();
    state = vote(state, 'me', 'left');
    expect(state.round?.status).toBe('voting');
    state = vote(state, 'zeynep', 'right');
    expect(state.round?.status).toBe('voting');
    state = vote(state, 'mert', 'left');
    expect(state.round?.status).toBe('revealing');
  });
});

describe('timer expiry', () => {
  it('skips a voter with no pending selection', () => {
    let state = startedState();
    const r = thisOrThatReducer(state, { type: 'TIMER_EXPIRED' });
    expect(r.state.round?.currentVoterIndex).toBe(1);
    expect(r.state.round?.votes.me).toBeUndefined();
  });

  it('locks in a pending selection when the timer expires', () => {
    let state = startedState();
    state = thisOrThatReducer(state, { type: 'SELECT_CHOICE', voterId: 'me', choice: 'left' }).state;
    state = thisOrThatReducer(state, { type: 'TIMER_EXPIRED' }).state;
    expect(state.round?.votes.me).toBe('left');
    expect(state.round?.currentVoterIndex).toBe(1);
  });

  it('reveals when the timer expires on the last voter', () => {
    let state = startedState();
    state = thisOrThatReducer(state, { type: 'TIMER_EXPIRED' }).state;
    state = thisOrThatReducer(state, { type: 'TIMER_EXPIRED' }).state;
    state = thisOrThatReducer(state, { type: 'TIMER_EXPIRED' }).state;
    expect(state.round?.status).toBe('revealing');
  });
});

describe('results: percentages, ties, unanimous', () => {
  it('computes correct vote percentage math', () => {
    let state = startedState();
    state = vote(state, 'me', 'left');
    state = vote(state, 'zeynep', 'left');
    state = vote(state, 'mert', 'right');
    const result = computeThisOrThatResult(state.round!);
    expect(result.leftCount).toBe(2);
    expect(result.rightCount).toBe(1);
    expect(result.leftPct).toBe(67);
    expect(result.rightPct).toBe(33);
    expect(result.leftPct + result.rightPct).toBe(100);
  });

  it('detects a perfect-split tie', () => {
    const twoVoters: ThisOrThatVoter[] = [voters[0], voters[1]];
    let state = thisOrThatReducer(createInitialState(), { type: 'START_SESSION', settings: DEFAULT_THIS_OR_THAT_SETTINGS, voters: twoVoters, now: 1 }).state;
    state = vote(state, 'me', 'left');
    state = vote(state, 'zeynep', 'right');
    const result = computeThisOrThatResult(state.round!);
    expect(result.isTie).toBe(true);
    expect(result.leftPct).toBe(50);
    expect(result.rightPct).toBe(50);
  });

  it('detects a unanimous result', () => {
    let state = startedState();
    state = vote(state, 'me', 'left');
    state = vote(state, 'zeynep', 'left');
    state = vote(state, 'mert', 'left');
    const result = computeThisOrThatResult(state.round!);
    expect(result.isUnanimous).toBe(true);
    expect(result.leftPct).toBe(100);
  });

  it('handles a round nobody voted in', () => {
    let state = startedState();
    state = thisOrThatReducer(state, { type: 'TIMER_EXPIRED' }).state;
    state = thisOrThatReducer(state, { type: 'TIMER_EXPIRED' }).state;
    state = thisOrThatReducer(state, { type: 'TIMER_EXPIRED' }).state;
    const result = computeThisOrThatResult(state.round!);
    expect(result.totalVotes).toBe(0);
    expect(result.isTie).toBe(false);
    expect(result.isUnanimous).toBe(false);
  });
});

describe('participant leaves mid-round', () => {
  it('removing an upcoming voter shrinks the turn order without disrupting the current turn', () => {
    const state = startedState();
    const result = thisOrThatReducer(state, { type: 'REMOVE_VOTER', voterId: 'mert' });
    expect(result.state.round?.voterOrder).toEqual(['me', 'zeynep']);
    expect(result.state.round?.voterOrder[result.state.round!.currentVoterIndex]).toBe('me');
  });

  it('removing the current voter advances the turn and clears any pending selection', () => {
    let state = startedState();
    state = thisOrThatReducer(state, { type: 'SELECT_CHOICE', voterId: 'me', choice: 'left' }).state;
    const result = thisOrThatReducer(state, { type: 'REMOVE_VOTER', voterId: 'me' });
    expect(result.state.round?.voterOrder).toEqual(['zeynep', 'mert']);
    expect(result.state.round?.pendingChoice).toBeNull();
  });

  it('leaving after already voting keeps the cast vote intact', () => {
    let state = startedState();
    state = vote(state, 'me', 'left');
    const result = thisOrThatReducer(state, { type: 'REMOVE_VOTER', voterId: 'me' });
    expect(result.state.round?.votes.me).toBe('left');
  });
});

describe('stale/duplicate action rejection', () => {
  it('rejects a select from someone who is not the current voter', () => {
    const state = startedState();
    const result = thisOrThatReducer(state, { type: 'SELECT_CHOICE', voterId: 'zeynep', choice: 'left' });
    expect(result.error).toBe('not-your-turn');
  });

  it('rejects a duplicate confirm from an already-voted slot (defensive re-dispatch)', () => {
    const state = startedState();
    const rigged = { ...state, round: { ...state.round!, votes: { me: 'left' as const }, pendingChoice: 'right' as const } };
    const result = thisOrThatReducer(rigged, { type: 'CONFIRM_VOTE', voterId: 'me' });
    expect(result.error).toBe('duplicate-vote');
  });
});

describe('round progression / session summary', () => {
  it('ends the session once the configured round count is reached', () => {
    let state = startedState({ roundCount: 5 });
    for (let i = 0; i < 5; i++) {
      state = thisOrThatReducer(state, { type: 'NEXT_ROUND', now: 1000 + i }).state;
    }
    expect(state.phase).toBe('summary');
    expect(state.round).toBeNull();
    expect(state.history).toHaveLength(5);
  });

  it('keeps going forever when set to endless', () => {
    let state = startedState({ roundCount: 'endless' });
    for (let i = 0; i < 15; i++) {
      state = thisOrThatReducer(state, { type: 'NEXT_ROUND', now: 1000 + i }).state;
    }
    expect(state.phase).toBe('playing');
  });

  it('computes most-divisive / biggest-agreement and per-voter similarity', () => {
    let state = startedState({ roundCount: 5 });
    // Round 1: unanimous (agreement)
    state = vote(state, 'me', 'left');
    state = vote(state, 'zeynep', 'left');
    state = vote(state, 'mert', 'left');
    state = thisOrThatReducer(state, { type: 'NEXT_ROUND', now: 10 }).state;
    // Round 2: perfect split-ish (2v1, more divisive than round 1)
    state = vote(state, 'me', 'left');
    state = vote(state, 'zeynep', 'right');
    state = vote(state, 'mert', 'right');
    state = thisOrThatReducer(state, { type: 'NEXT_ROUND', now: 20 }).state;
    // Round 3: same 2v1 split
    state = vote(state, 'me', 'left');
    state = vote(state, 'zeynep', 'right');
    state = vote(state, 'mert', 'right');
    state = thisOrThatReducer(state, { type: 'NEXT_ROUND', now: 30 }).state;

    const summary = computeSessionSummary(state);
    expect(summary.biggestAgreement?.votes).toEqual({ me: 'left', zeynep: 'left', mert: 'left' });
    expect(summary.mostDivisive?.votes.me).toBe('left');
    // 'me' matched the majority in rounds 2 and 3 (voted 'left' while majority both times... wait majority was 'right')
    // majority in round 2/3 is 'right' (zeynep+mert); 'me' voted 'left' both times -> never matches majority there,
    // but matches in round 1 (unanimous 'left'). So 'me' similarity = 1/3 matched = 33%.
    expect(summary.similarity.me).toBe(33);
    // 'zeynep' matches majority in all 3 rounds (left,right,right all majority) -> 100%
    expect(summary.similarity.zeynep).toBe(100);
  });
});
