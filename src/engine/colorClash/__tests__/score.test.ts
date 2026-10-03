import { describe, expect, it } from 'vitest';

import { buildDeck } from '../deck';
import { applyTimeout } from '../engine';
import { applyRoundScore, handPoints, scoreRound, startNextRound } from '../score';
import { assertConservation, type FullState } from '../state';
import { InvariantError, WINNING_SCORE } from '../types';
import { action, identityShuffle, num, wild } from './fixtures';
import { deps, gameWith, handSize, play } from './engineFixtures';

/** Seat 0 son kartını oynayıp eli bitirir. */
function finishedRound(options: { hands: Partial<Record<number, ReturnType<typeof num>[]>>; scores?: number[] }): FullState {
  const state = gameWith({ hands: { 0: [num('CRIMSON', 2)], ...options.hands }, start: num('CRIMSON', 7), currentSeat: 0 });
  const withScores = options.scores ? { ...state, seats: state.seats.map((s) => ({ ...s, score: options.scores![s.seat] ?? 0 })) } : state;
  const result = play(withScores, 0, { type: 'PLAY_CARD', cardId: num('CRIMSON', 2).id, calledClash: false });
  if (!result.ok) throw new Error('finishing play failed');
  return result.state;
}

describe('kart puanları — C056-C058', () => {
  it('C056: sayı kartları yüz değeri kadardır', () => {
    expect(handPoints([num('CRIMSON', 0)])).toBe(0);
    expect(handPoints([num('CRIMSON', 7)])).toBe(7);
    expect(handPoints([num('AZURE', 9)])).toBe(9);
  });

  it('C057: Block/Flip/Draw 2 kartları 20 puandır', () => {
    expect(handPoints([action('CRIMSON', 'BLOCK')])).toBe(20);
    expect(handPoints([action('AZURE', 'FLIP')])).toBe(20);
    expect(handPoints([action('LIME', 'DRAW_TWO')])).toBe(20);
  });

  it('C058: Color Shift/Clash 4 kartları 50 puandır', () => {
    expect(handPoints([wild('COLOR_SHIFT')])).toBe(50);
    expect(handPoints([wild('CLASH_FOUR')])).toBe(50);
  });
});

describe('el puanı — C059, C061', () => {
  it('C059: rakip elleri 7 + Block + Color Shift ise kazanan 77 alır', () => {
    const state = finishedRound({
      hands: { 1: [num('AZURE', 7)], 2: [action('LIME', 'BLOCK')], 3: [wild('COLOR_SHIFT')] },
    });
    const score = scoreRound(state);
    expect(score.winnerSeat).toBe(0);
    expect(score.awarded).toBe(7 + 20 + 50);
    expect(score.totals[0]).toBe(77);
    // Yalnızca el kazananı puan alır.
    expect(score.totals.slice(1)).toEqual([0, 0, 0]);
  });

  it('C061: el kazananı yokken skor yazılmaz', () => {
    const unfinished = gameWith({ hands: { 0: [num('CRIMSON', 2), num('CRIMSON', 3)] }, start: num('CRIMSON', 7), currentSeat: 0 });
    expect(() => scoreRound(unfinished)).toThrow(InvariantError);
  });
});

describe('maç sonu — C060', () => {
  it('C060: 499 puanlı oyuncu 1 puan alınca maçı kazanır', () => {
    const state = finishedRound({
      hands: { 1: [num('AZURE', 1)], 2: [], 3: [] },
      scores: [WINNING_SCORE - 1, 0, 0, 0],
    });
    const score = scoreRound(state);
    expect(score.awarded).toBe(1);
    expect(score.totals[0]).toBe(WINNING_SCORE);
    expect(score.matchWinnerSeat).toBe(0);

    const applied = applyRoundScore(state, score);
    expect(applied.status).toBe('MATCH_ENDED');
    expect(applied.seats[0].score).toBe(WINNING_SCORE);
  });

  it('500’ün altında maç sürer', () => {
    const state = finishedRound({ hands: { 1: [num('AZURE', 1)], 2: [], 3: [] } });
    const applied = applyRoundScore(state, scoreRound(state));
    expect(applied.status).toBe('ROUND_ENDED');
  });
});

describe('yeni el — C062', () => {
  it('C062: yeni elde dealer bir seat ilerler ve skorlar taşınır', () => {
    const state = finishedRound({ hands: { 1: [num('AZURE', 7)], 2: [], 3: [] } });
    const scored = applyRoundScore(state, scoreRound(state));
    const next = startNextRound(scored, buildDeck(), identityShuffle);

    expect(next.dealerSeat).toBe((scored.dealerSeat + 1) % 4);
    expect(next.round).toBe(scored.round + 1);
    expect(next.seats.map((s) => s.score)).toEqual(scored.seats.map((s) => s.score));
    expect(next.status).toBe('ACTIVE');
    expect(() => assertConservation(next)).not.toThrow();
  });
});

describe('timeout — C063, C064', () => {
  const state = () => gameWith({ hands: { 0: [num('AZURE', 1), num('LIME', 2)] }, start: num('CRIMSON', 7), currentSeat: 0 });

  it('C063: timeout bir kart çeker ve oynamadan geçirir', () => {
    const before = state();
    const result = applyTimeout(before, 0, deps);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(handSize(result.state, 0)).toBe(handSize(before, 0) + 1);
    expect(result.state.currentSeat).toBe(1);
    expect(result.state.discardPile).toHaveLength(before.discardPile.length);
  });

  it('C064: aynı tur için ikinci timeout kart çektirmez', () => {
    const first = applyTimeout(state(), 0, deps);
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const second = applyTimeout(first.state, 0, deps);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error).toBe('NOT_YOUR_TURN');
    expect(handSize(second.state, 0)).toBe(handSize(first.state, 0));
  });

  it('çekimden sonra timeout ikinci kart çekmez, sadece turu geçirir', () => {
    const drawn = play(state(), 0, { type: 'DRAW_CARD' });
    expect(drawn.ok).toBe(true);
    if (!drawn.ok) return;

    const timedOut = applyTimeout(drawn.state, 0, deps);
    expect(timedOut.ok).toBe(true);
    if (!timedOut.ok) return;
    expect(handSize(timedOut.state, 0)).toBe(handSize(drawn.state, 0));
    expect(timedOut.state.currentSeat).toBe(1);
  });
});
