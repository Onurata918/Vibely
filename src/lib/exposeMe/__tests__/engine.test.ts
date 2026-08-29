import { describe, expect, it } from 'vitest';

import { createInitialState, exposeMeReducer, questionText } from '../engine';
import { EXPOSE_ME_QUESTIONS, getRandomExposeMeQuestion } from '../exposeMeQuestions';
import { DEFAULT_EXPOSE_ME_SETTINGS, type ExposeMeSettings, type ExposeMeVoter } from '../types';

const voters: ExposeMeVoter[] = [
  { id: 'me', name: 'Onur', c1: '#111', c2: '#222' },
  { id: 'zeynep', name: 'Zeynep', c1: '#333', c2: '#444' },
  { id: 'mert', name: 'Mert', c1: '#555', c2: '#666' },
  { id: 'efe', name: 'Efe', c1: '#777', c2: '#888' },
];

function startedState(overrides: Partial<ExposeMeSettings> = {}) {
  const settings: ExposeMeSettings = { ...DEFAULT_EXPOSE_ME_SETTINGS, ...overrides };
  return exposeMeReducer(createInitialState(), { type: 'START_SESSION', settings, voters }).state;
}

describe('question selection', () => {
  it('filters by category', () => {
    for (let i = 0; i < 30; i++) {
      const q = getRandomExposeMeQuestion('savage');
      expect(q?.category).toBe('savage');
    }
  });

  it('filters by intensity', () => {
    for (let i = 0; i < 30; i++) {
      const q = getRandomExposeMeQuestion(undefined, 'bold');
      expect(q?.intensity).toBe('bold');
    }
  });

  it('picks Turkish/English text by language', () => {
    const q = EXPOSE_ME_QUESTIONS[0];
    expect(questionText(q, 'tr')).toBe(q.tr);
    expect(questionText(q, 'en')).toBe(q.en);
  });

  it('produces a roughly gentle-leaning mix under the "soft" setting (always soft)', () => {
    let state = startedState({ intensity: 'soft', roundCount: 'endless' });
    expect(state.round!.question.intensity).toBe('soft');
    for (let i = 0; i < 20; i++) {
      state = exposeMeReducer(state, { type: 'NEXT_ROUND' }).state;
      expect(state.round!.question.intensity).toBe('soft');
    }
  });

  it('produces a mix under "balanced" leaning soft/balanced with some bold', () => {
    let state = startedState({ intensity: 'balanced', roundCount: 'endless' });
    const counts: Record<string, number> = { soft: 0, balanced: 0, bold: 0 };
    counts[state.round!.question.intensity]++;
    for (let i = 0; i < 79; i++) {
      state = exposeMeReducer(state, { type: 'NEXT_ROUND' }).state;
      counts[state.round!.question.intensity]++;
    }
    expect(counts.soft + counts.balanced).toBeGreaterThan(counts.bold);
    expect(counts.bold).toBeGreaterThan(0);
  });
});

describe('no repeat + pool reset', () => {
  it('never repeats a question within a filtered category until the pool is exhausted', () => {
    let state = startedState({ category: 'savage', roundCount: 'endless' });
    const savagePoolSize = EXPOSE_ME_QUESTIONS.filter((q) => q.category === 'savage').length;
    const seen = new Set<string>([state.round!.question.id]);
    for (let i = 0; i < savagePoolSize - 1; i++) {
      state = exposeMeReducer(state, { type: 'NEXT_ROUND' }).state;
      const id = state.round!.question.id;
      expect(seen.has(id)).toBe(false);
      seen.add(id);
    }
    expect(seen.size).toBe(savagePoolSize);
    state = exposeMeReducer(state, { type: 'NEXT_ROUND' }).state;
    expect(state.round).not.toBeNull();
    expect(state.usedQuestionIds).toEqual([state.round!.question.id]);
  });
});

describe('player rotation', () => {
  it('does not repeat a player until everyone has had a turn', () => {
    let state = startedState({ roundCount: 'endless' });
    const seen = new Set<string>([state.round!.activePlayerId]);
    for (let i = 0; i < 3; i++) {
      state = exposeMeReducer(state, { type: 'NEXT_ROUND' }).state;
      const id = state.round!.activePlayerId;
      expect(seen.has(id)).toBe(false);
      seen.add(id);
    }
    expect(seen.size).toBe(4);
  });
});

describe('answer / skip behavior', () => {
  it('marks the round as answered', () => {
    const state = startedState();
    const result = exposeMeReducer(state, { type: 'MARK_ANSWERED' });
    expect(result.state.round?.status).toBe('answered');
  });

  it('marks the round as skipped, no penalty applied', () => {
    const state = startedState();
    const result = exposeMeReducer(state, { type: 'SKIP_QUESTION' });
    expect(result.state.round?.status).toBe('skipped');
  });

  it('rejects marking answered/skipped twice', () => {
    let state = startedState();
    state = exposeMeReducer(state, { type: 'MARK_ANSWERED' }).state;
    const result = exposeMeReducer(state, { type: 'MARK_ANSWERED' });
    expect(result.error).toBe('wrong-phase');
  });

  it('tracks a consecutive skip streak and resets it on an answer', () => {
    let state = startedState({ roundCount: 'endless' });
    state = exposeMeReducer(state, { type: 'SKIP_QUESTION' }).state;
    state = exposeMeReducer(state, { type: 'NEXT_ROUND' }).state;
    expect(state.skipStreak).toBe(1);
    state = exposeMeReducer(state, { type: 'SKIP_QUESTION' }).state;
    state = exposeMeReducer(state, { type: 'NEXT_ROUND' }).state;
    expect(state.skipStreak).toBe(2);
    state = exposeMeReducer(state, { type: 'MARK_ANSWERED' }).state;
    state = exposeMeReducer(state, { type: 'NEXT_ROUND' }).state;
    expect(state.skipStreak).toBe(0);
  });

  it('avoids bold intensity right after a skip streak of 2+', () => {
    let state = startedState({ intensity: 'bold', roundCount: 'endless' });
    state = exposeMeReducer(state, { type: 'SKIP_QUESTION' }).state;
    state = exposeMeReducer(state, { type: 'NEXT_ROUND' }).state;
    state = exposeMeReducer(state, { type: 'SKIP_QUESTION' }).state;
    state = exposeMeReducer(state, { type: 'NEXT_ROUND' }).state;
    expect(state.skipStreak).toBe(2);
    // With skipStreak >= 2 the next pick should avoid 'bold' regardless of the 'bold' setting.
    for (let i = 0; i < 10; i++) {
      expect(state.round!.question.intensity).not.toBe('bold');
      state = exposeMeReducer(state, { type: 'SKIP_QUESTION' }).state;
      state = exposeMeReducer(state, { type: 'NEXT_ROUND' }).state;
    }
  });
});

describe('history / round counting', () => {
  it('records answered and skipped rounds in history, counts both toward roundsPlayed', () => {
    let state = startedState({ roundCount: 5 });
    state = exposeMeReducer(state, { type: 'MARK_ANSWERED' }).state;
    state = exposeMeReducer(state, { type: 'NEXT_ROUND' }).state;
    state = exposeMeReducer(state, { type: 'SKIP_QUESTION' }).state;
    state = exposeMeReducer(state, { type: 'NEXT_ROUND' }).state;
    expect(state.history).toHaveLength(2);
    expect(state.history[0].status).toBe('answered');
    expect(state.history[1].status).toBe('skipped');
    expect(state.roundsPlayed).toBe(2);
  });

  it('ends the session once the configured round count is reached', () => {
    let state = startedState({ roundCount: 5 });
    for (let i = 0; i < 5; i++) {
      state = exposeMeReducer(state, { type: 'MARK_ANSWERED' }).state;
      state = exposeMeReducer(state, { type: 'NEXT_ROUND' }).state;
    }
    expect(state.phase).toBe('summary');
    expect(state.round).toBeNull();
  });

  it('keeps going forever when set to endless', () => {
    let state = startedState({ roundCount: 'endless' });
    for (let i = 0; i < 15; i++) {
      state = exposeMeReducer(state, { type: 'NEXT_ROUND' }).state;
    }
    expect(state.phase).toBe('playing');
  });
});

describe('stale/duplicate action rejection', () => {
  it('rejects SKIP_QUESTION once already revealed/advanced', () => {
    let state = startedState();
    state = exposeMeReducer(state, { type: 'MARK_ANSWERED' }).state;
    const result = exposeMeReducer(state, { type: 'SKIP_QUESTION' });
    expect(result.error).toBe('wrong-phase');
  });

  it('rejects starting a session with no voters', () => {
    const result = exposeMeReducer(createInitialState(), { type: 'START_SESSION', settings: DEFAULT_EXPOSE_ME_SETTINGS, voters: [] });
    expect(result.error).toBe('no-voters');
  });
});

describe('disconnects mid-session', () => {
  it('the active player leaving abandons the round and starts a fresh one', () => {
    const state = startedState();
    const activeId = state.round!.activePlayerId;
    const result = exposeMeReducer(state, { type: 'REMOVE_VOTER', voterId: activeId });
    expect(result.state.round).not.toBeNull();
    expect(result.state.round!.activePlayerId).not.toBe(activeId);
    expect(result.state.voters.some((v) => v.id === activeId)).toBe(false);
  });

  it('a non-active participant leaving does not disrupt the current round', () => {
    const state = startedState();
    const activeId = state.round!.activePlayerId;
    const bystander = voters.find((v) => v.id !== activeId)!.id;
    const result = exposeMeReducer(state, { type: 'REMOVE_VOTER', voterId: bystander });
    expect(result.state.round!.activePlayerId).toBe(activeId);
    expect(result.state.round!.question.id).toBe(state.round!.question.id);
  });

  it('ends the session gracefully when fewer than 2 players remain', () => {
    const twoVoters = voters.slice(0, 2);
    let state = exposeMeReducer(createInitialState(), { type: 'START_SESSION', settings: DEFAULT_EXPOSE_ME_SETTINGS, voters: twoVoters }).state;
    const otherId = twoVoters.find((v) => v.id !== state.round!.activePlayerId)!.id;
    const result = exposeMeReducer(state, { type: 'REMOVE_VOTER', voterId: otherId });
    expect(result.state.phase).toBe('summary');
  });
});
