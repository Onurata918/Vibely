import { describe, expect, it } from 'vitest';

import { computeWhosMostResult, createInitialState, questionText, whosMostReducer } from '../engine';
import { getRandomMostLikelyQuestion, MOST_LIKELY_QUESTIONS } from '../mostLikelyQuestions';
import { DEFAULT_WHOS_MOST_SETTINGS, type WhosMostSettings, type WhosMostVoter } from '../types';

const voters: WhosMostVoter[] = [
  { id: 'me', name: 'Onur', c1: '#111', c2: '#222' },
  { id: 'zeynep', name: 'Zeynep', c1: '#333', c2: '#444' },
  { id: 'mert', name: 'Mert', c1: '#555', c2: '#666' },
];

function startedState(overrides: Partial<WhosMostSettings> = {}, now = 1000) {
  const settings: WhosMostSettings = { ...DEFAULT_WHOS_MOST_SETTINGS, ...overrides };
  const result = whosMostReducer(createInitialState(), { type: 'START_SESSION', settings, voters, now });
  return result.state;
}

describe('question selection', () => {
  it('returns a random question from the full pool', () => {
    const q = getRandomMostLikelyQuestion();
    expect(q).not.toBeNull();
    expect(MOST_LIKELY_QUESTIONS).toContainEqual(q);
  });

  it('filters by category', () => {
    for (let i = 0; i < 30; i++) {
      const q = getRandomMostLikelyQuestion('love');
      expect(q?.category).toBe('love');
    }
  });

  it('picks Turkish/English text by language', () => {
    const q = MOST_LIKELY_QUESTIONS[0];
    expect(questionText(q, 'tr')).toBe(q.tr);
    expect(questionText(q, 'en')).toBe(q.en);
    expect(questionText(q, 'tr')).not.toBe(questionText(q, 'en'));
  });
});

describe('session start / category filtering', () => {
  it('starts a round with a question matching the chosen category', () => {
    const state = startedState({ category: 'funny' });
    expect(state.round?.question.category).toBe('funny');
  });

  it('starts a round with any category when mixed', () => {
    const state = startedState({ category: 'mixed' });
    expect(state.round).not.toBeNull();
  });

  it('rejects starting a session with no voters', () => {
    const result = whosMostReducer(createInitialState(), {
      type: 'START_SESSION',
      settings: DEFAULT_WHOS_MOST_SETTINGS,
      voters: [],
      now: 1,
    });
    expect(result.error).toBe('no-voters');
  });
});

describe('no repeat within a session', () => {
  it('never repeats a question until the category pool is exhausted', () => {
    let state = startedState({ category: 'party', questionCount: 'endless' });
    const seen = new Set<string>([state.round!.question.id]);
    // 'party' category has 10 questions; asking 9 more must all be unique.
    for (let i = 0; i < 9; i++) {
      const result = whosMostReducer(state, { type: 'NEXT_QUESTION', now: 1000 + i });
      state = result.state;
      const id = state.round!.question.id;
      expect(seen.has(id)).toBe(false);
      seen.add(id);
    }
    expect(seen.size).toBe(10);
  });
});

describe('voting', () => {
  it('rejects a self vote when self-voting is disabled', () => {
    const state = startedState({ selfVoteEnabled: false });
    const result = whosMostReducer(state, { type: 'SUBMIT_VOTE', voterId: 'me', targetId: 'me' });
    expect(result.error).toBe('self-vote-disabled');
  });

  it('allows a self vote when self-voting is enabled', () => {
    const state = startedState({ selfVoteEnabled: true });
    const result = whosMostReducer(state, { type: 'SUBMIT_VOTE', voterId: 'me', targetId: 'me' });
    expect(result.error).toBeUndefined();
    expect(result.state.round?.votes.me).toBe('me');
  });

  it('enforces one vote per voter via turn order (stale vote rejected)', () => {
    let state = startedState();
    const first = whosMostReducer(state, { type: 'SUBMIT_VOTE', voterId: 'me', targetId: 'zeynep' });
    expect(first.error).toBeUndefined();
    state = first.state;
    // 'me' tries to vote again after the turn has moved on.
    const stale = whosMostReducer(state, { type: 'SUBMIT_VOTE', voterId: 'me', targetId: 'mert' });
    expect(stale.error).toBe('not-your-turn');
  });

  it('rejects a duplicate vote from the same voter in the same turn slot', () => {
    const state = startedState();
    // Craft a round where the current voter has already (somehow) voted —
    // defends against a stale/duplicate re-dispatch of the same action.
    const rigged = {
      ...state,
      round: { ...state.round!, votes: { me: 'zeynep' } },
    };
    const result = whosMostReducer(rigged, { type: 'SUBMIT_VOTE', voterId: 'me', targetId: 'mert' });
    expect(result.error).toBe('duplicate-vote');
  });

  it('rejects a vote for someone not in the voter list', () => {
    const state = startedState();
    const result = whosMostReducer(state, { type: 'SUBMIT_VOTE', voterId: 'me', targetId: 'ghost' });
    expect(result.error).toBe('invalid-target');
  });

  it('rejects votes once the round is no longer in voting status', () => {
    let state = startedState();
    for (const v of voters) {
      const r = whosMostReducer(state, { type: 'SUBMIT_VOTE', voterId: v.id, targetId: voters[0].id === v.id ? voters[1].id : voters[0].id });
      state = r.state;
    }
    expect(state.round?.status).toBe('revealing');
    const late = whosMostReducer(state, { type: 'SUBMIT_VOTE', voterId: 'me', targetId: 'mert' });
    expect(late.error).toBe('not-voting');
  });

  it('reveals early once every voter has voted', () => {
    let state = startedState();
    expect(state.round?.status).toBe('voting');
    const r1 = whosMostReducer(state, { type: 'SUBMIT_VOTE', voterId: 'me', targetId: 'zeynep' });
    state = r1.state;
    expect(state.round?.status).toBe('voting');
    const r2 = whosMostReducer(state, { type: 'SUBMIT_VOTE', voterId: 'zeynep', targetId: 'mert' });
    state = r2.state;
    expect(state.round?.status).toBe('voting');
    const r3 = whosMostReducer(state, { type: 'SUBMIT_VOTE', voterId: 'mert', targetId: 'me' });
    state = r3.state;
    expect(state.round?.status).toBe('revealing');
  });
});

describe('timer expiry', () => {
  it('skips the current voter and advances the turn', () => {
    let state = startedState();
    const r = whosMostReducer(state, { type: 'TIMER_EXPIRED' });
    expect(r.error).toBeUndefined();
    expect(r.state.round?.currentVoterIndex).toBe(1);
    expect(r.state.round?.status).toBe('voting');
  });

  it('reveals when the timer expires on the last voter', () => {
    let state = startedState();
    state = whosMostReducer(state, { type: 'TIMER_EXPIRED' }).state;
    state = whosMostReducer(state, { type: 'TIMER_EXPIRED' }).state;
    state = whosMostReducer(state, { type: 'TIMER_EXPIRED' }).state;
    expect(state.round?.status).toBe('revealing');
    expect(Object.keys(state.round!.votes)).toHaveLength(0);
  });
});

describe('results / ties', () => {
  it('computes a single winner', () => {
    let state = startedState();
    state = whosMostReducer(state, { type: 'SUBMIT_VOTE', voterId: 'me', targetId: 'zeynep' }).state;
    state = whosMostReducer(state, { type: 'SUBMIT_VOTE', voterId: 'zeynep', targetId: 'mert' }).state;
    state = whosMostReducer(state, { type: 'SUBMIT_VOTE', voterId: 'mert', targetId: 'zeynep' }).state;
    const result = computeWhosMostResult(state.round!);
    expect(result.isTie).toBe(false);
    expect(result.winnerIds).toEqual(['zeynep']);
    expect(result.maxVotes).toBe(2);
  });

  it('supports ties', () => {
    let state = startedState();
    state = whosMostReducer(state, { type: 'SUBMIT_VOTE', voterId: 'me', targetId: 'zeynep' }).state;
    state = whosMostReducer(state, { type: 'SUBMIT_VOTE', voterId: 'zeynep', targetId: 'mert' }).state;
    state = whosMostReducer(state, { type: 'SUBMIT_VOTE', voterId: 'mert', targetId: 'me' }).state;
    const result = computeWhosMostResult(state.round!);
    expect(result.isTie).toBe(true);
    expect(result.winnerIds.sort()).toEqual(['me', 'mert', 'zeynep'].sort());
  });

  it('reports no winners when nobody voted', () => {
    let state = startedState();
    state = whosMostReducer(state, { type: 'TIMER_EXPIRED' }).state;
    state = whosMostReducer(state, { type: 'TIMER_EXPIRED' }).state;
    state = whosMostReducer(state, { type: 'TIMER_EXPIRED' }).state;
    const result = computeWhosMostResult(state.round!);
    expect(result.winnerIds).toEqual([]);
    expect(result.maxVotes).toBe(0);
  });
});

describe('participant leaves mid-round', () => {
  it('removing an upcoming voter shrinks the turn order without disrupting the current turn', () => {
    let state = startedState(); // order: me, zeynep, mert — current: me
    const result = whosMostReducer(state, { type: 'REMOVE_VOTER', voterId: 'mert' });
    expect(result.state.round?.voterOrder).toEqual(['me', 'zeynep']);
    expect(result.state.round?.voterOrder[result.state.round!.currentVoterIndex]).toBe('me');
  });

  it('removing the current voter advances the turn to the next voter', () => {
    let state = startedState(); // current: me
    const result = whosMostReducer(state, { type: 'REMOVE_VOTER', voterId: 'me' });
    expect(result.state.round?.voterOrder).toEqual(['zeynep', 'mert']);
    expect(result.state.round?.voterOrder[result.state.round!.currentVoterIndex]).toBe('zeynep');
  });

  it('removing the last remaining pending voter triggers reveal', () => {
    let state = startedState();
    state = whosMostReducer(state, { type: 'SUBMIT_VOTE', voterId: 'me', targetId: 'zeynep' }).state;
    state = whosMostReducer(state, { type: 'SUBMIT_VOTE', voterId: 'zeynep', targetId: 'mert' }).state;
    // Only 'mert' is left to vote — they leave before their turn.
    const result = whosMostReducer(state, { type: 'REMOVE_VOTER', voterId: 'mert' });
    expect(result.state.round?.status).toBe('revealing');
  });

  it('leaving after already voting keeps the cast vote intact', () => {
    let state = startedState();
    state = whosMostReducer(state, { type: 'SUBMIT_VOTE', voterId: 'me', targetId: 'zeynep' }).state;
    const result = whosMostReducer(state, { type: 'REMOVE_VOTER', voterId: 'me' });
    expect(result.state.round?.votes.me).toBe('zeynep');
  });
});

describe('question progression', () => {
  it('ends the session once the configured question count is reached', () => {
    let state = startedState({ questionCount: 5 });
    for (let i = 0; i < 5; i++) {
      state = whosMostReducer(state, { type: 'NEXT_QUESTION', now: 1000 + i }).state;
    }
    expect(state.phase).toBe('summary');
    expect(state.round).toBeNull();
  });

  it('keeps going forever when set to endless', () => {
    let state = startedState({ questionCount: 'endless' });
    for (let i = 0; i < 20; i++) {
      state = whosMostReducer(state, { type: 'NEXT_QUESTION', now: 1000 + i }).state;
    }
    expect(state.phase).toBe('playing');
    expect(state.round).not.toBeNull();
  });
});
