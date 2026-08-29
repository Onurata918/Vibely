import { describe, expect, it } from 'vitest';

import { computeSessionStats, createInitialState, challengeText, fiveSecondReducer } from '../engine';
import { getRandomFiveSecondChallenge, FIVE_SECOND_CHALLENGES } from '../fiveSecondChallenges';
import { ANSWER_SECONDS, DEFAULT_FIVE_SECOND_SETTINGS, type FiveSecondSettings, type FiveSecondVoter } from '../types';

const voters: FiveSecondVoter[] = [
  { id: 'me', name: 'Onur', c1: '#111', c2: '#222' },
  { id: 'zeynep', name: 'Zeynep', c1: '#333', c2: '#444' },
  { id: 'mert', name: 'Mert', c1: '#555', c2: '#666' },
  { id: 'efe', name: 'Efe', c1: '#777', c2: '#888' },
];

function startedState(overrides: Partial<FiveSecondSettings> = {}, now = 1000) {
  const settings: FiveSecondSettings = { ...DEFAULT_FIVE_SECOND_SETTINGS, ...overrides };
  return fiveSecondReducer(createInitialState(), { type: 'START_SESSION', settings, voters, now }).state;
}

function judgeAllSuccess(state: ReturnType<typeof startedState>) {
  let s = state;
  for (const id of s.round!.judgeOrder) {
    s = fiveSecondReducer(s, { type: 'SUBMIT_JUDGEMENT', voterId: id, success: true }).state;
  }
  return s;
}

describe('challenge selection', () => {
  it('filters by difficulty', () => {
    for (let i = 0; i < 30; i++) {
      const c = getRandomFiveSecondChallenge('hard');
      expect(c?.difficulty).toBe('hard');
    }
  });

  it('filters by category', () => {
    for (let i = 0; i < 30; i++) {
      const c = getRandomFiveSecondChallenge(undefined, 'music');
      expect(c?.category).toBe('music');
    }
  });

  it('combines difficulty and category filters', () => {
    const c = getRandomFiveSecondChallenge('easy', 'food');
    expect(c?.difficulty).toBe('easy');
    expect(c?.category).toBe('food');
  });

  it('produces a mixed difficulty distribution roughly matching 25/55/20', () => {
    // Uses the full (category: 'mixed') pool and a sample well under the
    // smallest tier's pool size (easy = 30) so the no-repeat/reset mechanics
    // don't skew the measured ratio — this checks the selection weighting
    // itself, not long-session pool-exhaustion behavior (covered separately).
    let state = startedState({ roundCount: 'endless' });
    const counts: Record<string, number> = { easy: 0, medium: 0, hard: 0, chaos: 0 };
    counts[state.round!.challenge.difficulty]++;
    for (let i = 0; i < 99; i++) {
      state = fiveSecondReducer(state, { type: 'NEXT_ROUND', now: 1000 + i }).state;
      counts[state.round!.challenge.difficulty]++;
    }
    const total = 100;
    expect(counts.easy / total).toBeGreaterThan(0.1);
    expect(counts.easy / total).toBeLessThan(0.4);
    expect(counts.medium / total).toBeGreaterThan(0.35);
    expect(counts.medium / total).toBeLessThan(0.75);
    expect((counts.hard + counts.chaos) / total).toBeGreaterThan(0.05);
    expect((counts.hard + counts.chaos) / total).toBeLessThan(0.4);
  });

  it('picks Turkish/English text by language', () => {
    const c = FIVE_SECOND_CHALLENGES[0];
    expect(challengeText(c, 'tr')).toBe(c.tr);
    expect(challengeText(c, 'en')).toBe(c.en);
  });
});

describe('no repeat + pool reset', () => {
  it('never repeats a challenge within a filtered category until the pool is exhausted', () => {
    // 'music' category has fewer than 20 entries across all difficulties combined.
    let state = startedState({ category: 'music', roundCount: 'endless' });
    const musicPoolSize = FIVE_SECOND_CHALLENGES.filter((c) => c.category === 'music').length;
    const seen = new Set<string>([state.round!.challenge.id]);
    for (let i = 0; i < musicPoolSize - 1; i++) {
      state = fiveSecondReducer(state, { type: 'NEXT_ROUND', now: 1000 + i }).state;
      const id = state.round!.challenge.id;
      expect(seen.has(id)).toBe(false);
      seen.add(id);
    }
    expect(seen.size).toBe(musicPoolSize);
    // Pool exhausted — next round resets and can reuse an earlier id.
    state = fiveSecondReducer(state, { type: 'NEXT_ROUND', now: 5000 }).state;
    expect(state.round).not.toBeNull();
    expect(state.usedChallengeIds).toEqual([state.round!.challenge.id]);
  });
});

describe('player rotation', () => {
  it('does not repeat a player until everyone has had a turn', () => {
    let state = startedState({ roundCount: 'endless' });
    const seen = new Set<string>([state.round!.activePlayerId]);
    for (let i = 0; i < 3; i++) {
      state = fiveSecondReducer(state, { type: 'NEXT_ROUND', now: 1000 + i }).state;
      const id = state.round!.activePlayerId;
      expect(seen.has(id)).toBe(false);
      seen.add(id);
    }
    expect(seen.size).toBe(4);
    // 5th round starts a new rotation cycle — can repeat now.
    state = fiveSecondReducer(state, { type: 'NEXT_ROUND', now: 2000 }).state;
    expect(voters.some((v) => v.id === state.round!.activePlayerId)).toBe(true);
  });

  it('excludes the active player from the judge order', () => {
    const state = startedState();
    expect(state.round!.judgeOrder).not.toContain(state.round!.activePlayerId);
    expect(state.round!.judgeOrder).toHaveLength(voters.length - 1);
  });
});

describe('ready -> answering timer math', () => {
  it('sets synchronized start/end timestamps for the ready countdown and the answer timer', () => {
    const state = startedState({ readyCountdown: 3 }, 10_000);
    expect(state.round!.readyStartsAt).toBe(10_000);
    expect(state.round!.readyEndsAt).toBe(13_000);

    const answering = fiveSecondReducer(state, { type: 'READY_DONE', now: 13_000 }).state;
    expect(answering.round!.answerStartsAt).toBe(13_000);
    expect(answering.round!.answerEndsAt).toBe(13_000 + ANSWER_SECONDS * 1000);
    expect(answering.round!.status).toBe('answering');
  });

  it('rejects READY_DONE when not in the ready phase', () => {
    const state = startedState();
    const answering = fiveSecondReducer(state, { type: 'READY_DONE', now: 1 }).state;
    const result = fiveSecondReducer(answering, { type: 'READY_DONE', now: 2 });
    expect(result.error).toBe('wrong-phase');
  });
});

describe('judging: group vote', () => {
  it('rejects the active player judging themselves', () => {
    let state = startedState();
    state = fiveSecondReducer(state, { type: 'READY_DONE', now: 1 }).state;
    state = fiveSecondReducer(state, { type: 'ANSWER_TIMEOUT' }).state;
    const result = fiveSecondReducer(state, { type: 'SUBMIT_JUDGEMENT', voterId: state.round!.activePlayerId, success: true });
    expect(result.error).toBe('self-judge');
  });

  it('enforces one judgement per participant via turn order (stale re-vote rejected)', () => {
    let state = startedState();
    state = fiveSecondReducer(state, { type: 'READY_DONE', now: 1 }).state;
    state = fiveSecondReducer(state, { type: 'ANSWER_TIMEOUT' }).state;
    const firstJudge = state.round!.judgeOrder[0];
    state = fiveSecondReducer(state, { type: 'SUBMIT_JUDGEMENT', voterId: firstJudge, success: true }).state;
    const stale = fiveSecondReducer(state, { type: 'SUBMIT_JUDGEMENT', voterId: firstJudge, success: false });
    expect(stale.error).toBe('not-your-turn');
  });

  it('rejects a duplicate judgement re-dispatch (defensive check)', () => {
    let state = startedState();
    state = fiveSecondReducer(state, { type: 'READY_DONE', now: 1 }).state;
    state = fiveSecondReducer(state, { type: 'ANSWER_TIMEOUT' }).state;
    const firstJudge = state.round!.judgeOrder[0];
    const rigged = { ...state, round: { ...state.round!, votes: { [firstJudge]: true } } };
    const result = fiveSecondReducer(rigged, { type: 'SUBMIT_JUDGEMENT', voterId: firstJudge, success: false });
    expect(result.error).toBe('duplicate-vote');
  });

  it('decides success by majority', () => {
    let state = startedState();
    state = fiveSecondReducer(state, { type: 'READY_DONE', now: 1 }).state;
    state = fiveSecondReducer(state, { type: 'ANSWER_TIMEOUT' }).state;
    const [j1, j2, j3] = state.round!.judgeOrder;
    state = fiveSecondReducer(state, { type: 'SUBMIT_JUDGEMENT', voterId: j1, success: true }).state;
    state = fiveSecondReducer(state, { type: 'SUBMIT_JUDGEMENT', voterId: j2, success: true }).state;
    state = fiveSecondReducer(state, { type: 'SUBMIT_JUDGEMENT', voterId: j3, success: false }).state;
    expect(state.round!.status).toBe('revealing');
    expect(state.round!.result).toBe(true);
  });

  it('decides failure by majority', () => {
    let state = startedState();
    state = fiveSecondReducer(state, { type: 'READY_DONE', now: 1 }).state;
    state = fiveSecondReducer(state, { type: 'ANSWER_TIMEOUT' }).state;
    const [j1, j2, j3] = state.round!.judgeOrder;
    state = fiveSecondReducer(state, { type: 'SUBMIT_JUDGEMENT', voterId: j1, success: false }).state;
    state = fiveSecondReducer(state, { type: 'SUBMIT_JUDGEMENT', voterId: j2, success: false }).state;
    state = fiveSecondReducer(state, { type: 'SUBMIT_JUDGEMENT', voterId: j3, success: true }).state;
    expect(state.round!.result).toBe(false);
  });

  it('treats a tie as "Not quite"', () => {
    const twoJudgeVoters = voters.slice(0, 3); // 1 active + 2 judges -> tie possible
    let state = fiveSecondReducer(createInitialState(), { type: 'START_SESSION', settings: DEFAULT_FIVE_SECOND_SETTINGS, voters: twoJudgeVoters, now: 1 }).state;
    state = fiveSecondReducer(state, { type: 'READY_DONE', now: 1 }).state;
    state = fiveSecondReducer(state, { type: 'ANSWER_TIMEOUT' }).state;
    const [j1, j2] = state.round!.judgeOrder;
    state = fiveSecondReducer(state, { type: 'SUBMIT_JUDGEMENT', voterId: j1, success: true }).state;
    state = fiveSecondReducer(state, { type: 'SUBMIT_JUDGEMENT', voterId: j2, success: false }).state;
    expect(state.round!.result).toBe(false);
  });
});

describe('judging: host decides', () => {
  it('lets the host decide directly and rejects group-vote actions', () => {
    let state = startedState({ judgeMode: 'host' });
    state = fiveSecondReducer(state, { type: 'READY_DONE', now: 1 }).state;
    state = fiveSecondReducer(state, { type: 'ANSWER_TIMEOUT' }).state;
    const groupAttempt = fiveSecondReducer(state, { type: 'SUBMIT_JUDGEMENT', voterId: state.round!.judgeOrder[0], success: true });
    expect(groupAttempt.error).toBe('wrong-mode');
    const result = fiveSecondReducer(state, { type: 'HOST_JUDGE', success: true });
    expect(result.state.round!.status).toBe('revealing');
    expect(result.state.round!.result).toBe(true);
  });

  it('rejects HOST_JUDGE in group mode', () => {
    let state = startedState({ judgeMode: 'group' });
    state = fiveSecondReducer(state, { type: 'READY_DONE', now: 1 }).state;
    state = fiveSecondReducer(state, { type: 'ANSWER_TIMEOUT' }).state;
    const result = fiveSecondReducer(state, { type: 'HOST_JUDGE', success: true });
    expect(result.error).toBe('wrong-mode');
  });
});

describe('stale/duplicate action rejection', () => {
  it('rejects ANSWER_TIMEOUT when not answering', () => {
    const state = startedState();
    const result = fiveSecondReducer(state, { type: 'ANSWER_TIMEOUT' });
    expect(result.error).toBe('wrong-phase');
  });

  it('rejects judgement submitted before judging phase starts', () => {
    const state = startedState();
    const result = fiveSecondReducer(state, { type: 'SUBMIT_JUDGEMENT', voterId: state.round!.judgeOrder[0], success: true });
    expect(result.error).toBe('wrong-phase');
  });
});

describe('disconnects mid-round', () => {
  it('a judge leaving mid-judging shrinks the judge order without losing the current turn', () => {
    let state = startedState();
    state = fiveSecondReducer(state, { type: 'READY_DONE', now: 1 }).state;
    state = fiveSecondReducer(state, { type: 'ANSWER_TIMEOUT' }).state;
    const upcomingJudge = state.round!.judgeOrder[state.round!.judgeOrder.length - 1];
    const result = fiveSecondReducer(state, { type: 'REMOVE_VOTER', voterId: upcomingJudge });
    expect(result.state.round!.judgeOrder).not.toContain(upcomingJudge);
    expect(result.state.round!.status).toBe('judging');
  });

  it('the last pending judge leaving triggers reveal', () => {
    let state = startedState();
    state = fiveSecondReducer(state, { type: 'READY_DONE', now: 1 }).state;
    state = fiveSecondReducer(state, { type: 'ANSWER_TIMEOUT' }).state;
    const [j1, j2, j3] = state.round!.judgeOrder;
    state = fiveSecondReducer(state, { type: 'SUBMIT_JUDGEMENT', voterId: j1, success: true }).state;
    state = fiveSecondReducer(state, { type: 'SUBMIT_JUDGEMENT', voterId: j2, success: true }).state;
    const result = fiveSecondReducer(state, { type: 'REMOVE_VOTER', voterId: j3 });
    expect(result.state.round!.status).toBe('revealing');
    expect(result.state.round!.result).toBe(true);
  });

  it('the active player disconnecting abandons the round and starts a fresh one', () => {
    const state = startedState();
    const activeId = state.round!.activePlayerId;
    const result = fiveSecondReducer(state, { type: 'REMOVE_VOTER', voterId: activeId });
    expect(result.state.round).not.toBeNull();
    expect(result.state.round!.activePlayerId).not.toBe(activeId);
    expect(result.state.voters.some((v) => v.id === activeId)).toBe(false);
  });

  it('ends the session gracefully when fewer than 2 players remain', () => {
    const twoVoters = voters.slice(0, 2);
    let state = fiveSecondReducer(createInitialState(), { type: 'START_SESSION', settings: DEFAULT_FIVE_SECOND_SETTINGS, voters: twoVoters, now: 1 }).state;
    const otherId = twoVoters.find((v) => v.id !== state.round!.activePlayerId)!.id;
    const result = fiveSecondReducer(state, { type: 'REMOVE_VOTER', voterId: otherId });
    expect(result.state.phase).toBe('summary');
  });
});

describe('scoring / session stats', () => {
  it('tracks attempts, successes and success rate per player', () => {
    let state = startedState({ roundCount: 5 });
    // Round 1: active player succeeds.
    state = fiveSecondReducer(state, { type: 'READY_DONE', now: 1 }).state;
    state = fiveSecondReducer(state, { type: 'ANSWER_TIMEOUT' }).state;
    state = judgeAllSuccess(state);
    const firstPlayer = state.history.length === 0 ? state.round!.activePlayerId : state.history[0].activePlayerId;
    state = fiveSecondReducer(state, { type: 'NEXT_ROUND', now: 10 }).state;

    expect(state.history).toHaveLength(1);
    expect(state.history[0].success).toBe(true);

    const stats = computeSessionStats(state);
    const firstPlayerStats = stats.find((s) => s.voter.id === firstPlayer)!;
    expect(firstPlayerStats.attempts).toBe(1);
    expect(firstPlayerStats.successes).toBe(1);
    expect(firstPlayerStats.successRate).toBe(100);

    const neverPlayedStats = stats.find((s) => s.attempts === 0);
    expect(neverPlayedStats?.successRate).toBe(0);
  });

  it('supports a score tie between two players with equal success counts', () => {
    let state = startedState({ roundCount: 'endless' });
    for (let i = 0; i < 2; i++) {
      state = fiveSecondReducer(state, { type: 'READY_DONE', now: i }).state;
      state = fiveSecondReducer(state, { type: 'ANSWER_TIMEOUT' }).state;
      state = judgeAllSuccess(state);
      state = fiveSecondReducer(state, { type: 'NEXT_ROUND', now: 100 + i }).state;
    }
    const stats = computeSessionStats(state);
    const withAttempts = stats.filter((s) => s.attempts > 0);
    expect(withAttempts.every((s) => s.successes === s.attempts)).toBe(true);
  });
});

describe('round progression', () => {
  it('ends the session once the configured round count is reached', () => {
    let state = startedState({ roundCount: 5 });
    for (let i = 0; i < 5; i++) {
      state = fiveSecondReducer(state, { type: 'READY_DONE', now: i }).state;
      state = fiveSecondReducer(state, { type: 'ANSWER_TIMEOUT' }).state;
      state = judgeAllSuccess(state);
      state = fiveSecondReducer(state, { type: 'NEXT_ROUND', now: 1000 + i }).state;
    }
    expect(state.phase).toBe('summary');
    expect(state.round).toBeNull();
    expect(state.history).toHaveLength(5);
  });

  it('keeps going forever when set to endless', () => {
    let state = startedState({ roundCount: 'endless' });
    for (let i = 0; i < 15; i++) {
      state = fiveSecondReducer(state, { type: 'NEXT_ROUND', now: 1000 + i }).state;
    }
    expect(state.phase).toBe('playing');
  });
});
