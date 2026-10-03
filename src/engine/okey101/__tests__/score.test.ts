import { describe, expect, it } from 'vitest';

import { scoreRound, type ScoreBreakdown } from '../score';
import { type FinishKind, type FullState } from '../state';
import { type OpeningStatus, type Seat } from '../types';
import { buildState } from './turnFixtures';

/**
 * Skor testleri validator ve tur motorundan bagimsizdir: bitmis bir el
 * dogrudan kurulur ve beklenen sayilar GAME_RULES R10 tablosundan alinir.
 */
function finishedRound(options: {
  finishKind: FinishKind;
  winnerSeat: Seat | null;
  hands: Partial<Record<Seat, string[]>>;
  opening: Partial<Record<Seat, OpeningStatus>>;
  penalties?: Partial<Record<Seat, number>>;
}): FullState {
  const base = buildState({ hands: options.hands, opening: options.opening });
  return {
    ...base,
    status: 'ROUND_ENDED',
    finishKind: options.finishKind,
    winnerSeat: options.winnerSeat,
    seats: base.seats.map((s) => ({ ...s, actionPenalties: options.penalties?.[s.seat] ?? 0 })),
  };
}

const totalFor = (state: FullState, seat: Seat): number => scoreRound(state)[seat].breakdown.total;
const breakdownFor = (state: FullState, seat: Seat): ScoreBreakdown => scoreRound(state)[seat].breakdown;

/** Elde normal toplam 17: R8 + R9 = 17. */
const HAND_17 = ['R8', 'R9'];
/** Gösterge Y12 olduğu için gerçek okey Y13'tür. */
const JOKER = 'Y13';

describe('kaybeden puanı — R10', () => {
  const loser = (opening: OpeningStatus, finishKind: FinishKind, hand: string[], penalties = 0) =>
    finishedRound({
      finishKind,
      winnerSeat: 0,
      hands: { 0: ['K2'], 1: hand },
      opening: { 0: 'SERIES', 1: opening },
      penalties: { 1: penalties },
    });

  it('T124: normal bitiş, SERIES, elde 17 -> 17', () => expect(totalFor(loser('SERIES', 'NORMAL', HAND_17), 1)).toBe(17));
  it('T125: normal bitiş, PAIRS, elde 17 -> 34', () => expect(totalFor(loser('PAIRS', 'NORMAL', HAND_17), 1)).toBe(34));
  it('T126: okey bitiş, SERIES, elde 17 -> 34', () => expect(totalFor(loser('SERIES', 'JOKER', HAND_17), 1)).toBe(34));
  it('T127: okey bitiş, PAIRS, elde 17 -> 68', () => expect(totalFor(loser('PAIRS', 'JOKER', HAND_17), 1)).toBe(68));
  it('T123: açmamış, normal bitiş -> 202', () => expect(totalFor(loser('UNOPENED', 'NORMAL', HAND_17), 1)).toBe(202));
  it('T128: açmamış, okey bitiş -> 404', () => expect(totalFor(loser('UNOPENED', 'JOKER', HAND_17), 1)).toBe(404));

  it('T129: SERIES, 17 + elde bir gerçek okey -> 118', () => {
    expect(totalFor(loser('SERIES', 'NORMAL', [...HAND_17, JOKER]), 1)).toBe(118);
  });

  it('T130: SERIES, 17 + elde iki gerçek okey -> 219', () => {
    expect(totalFor(loser('SERIES', 'NORMAL', [...HAND_17, 'Y13#1', 'Y13#2']), 1)).toBe(219);
  });

  it('T131: okey bitiş, PAIRS, 17 + bir okey -> 169; joker cezası çarpılmaz', () => {
    const state = loser('PAIRS', 'JOKER', [...HAND_17, JOKER]);
    const b = breakdownFor(state, 1);
    expect(b.handBase).toBe(34);
    expect(b.finishMultiplier).toBe(2);
    expect(b.heldJoker).toBe(101);
    expect(b.total).toBe(169);
  });

  it('T132: açmamış oyuncuda elde okey 202’ye eklenmez', () => {
    expect(totalFor(loser('UNOPENED', 'NORMAL', [...HAND_17, JOKER]), 1)).toBe(202);
  });

  it('T133: R6 gösterge, SERIES, elde sadece bir sahte okey -> 7', () => {
    // Sahte okeyin efektif yüzü göstergenin bir üstüdür.
    const base = finishedRound({ finishKind: 'NORMAL', winnerSeat: 0, hands: { 0: ['K2'], 1: ['FJ'] }, opening: { 0: 'SERIES', 1: 'SERIES' } });
    const withR6Indicator: FullState = {
      ...base,
      indicator: { id: 'R6#2', kind: 'NUMBER', face: { color: 'RED', value: 6 }, copy: 2 },
    };
    expect(totalFor(withR6Indicator, 1)).toBe(7);
  });

  it('T142: handBase 17, okey bitiş, 101 hamle cezası -> 135; ceza çarpılmaz', () => {
    const state = loser('SERIES', 'JOKER', HAND_17, 101);
    const b = breakdownFor(state, 1);
    expect(b.handBase).toBe(17);
    expect(b.finishMultiplier).toBe(2);
    expect(b.actionPenalties).toBe(101);
    expect(b.total).toBe(135);
  });
});

describe('kazanan puanı — R10', () => {
  const winner = (finishKind: FinishKind, penalties = 0) =>
    finishedRound({ finishKind, winnerSeat: 0, hands: { 0: [], 1: HAND_17 }, opening: { 0: 'SERIES', 1: 'SERIES' }, penalties: { 0: penalties } });

  it('T114: normal bitiş -> -101', () => expect(totalFor(winner('NORMAL'), 0)).toBe(-101));
  it('T115: okey bitiş -> -202', () => expect(totalFor(winner('JOKER'), 0)).toBe(-202));
  it('T117: elden bitiş -> -202', () => expect(totalFor(winner('CLEAN'), 0)).toBe(-202));
  it('T120: elden + okey -> -404', () => expect(totalFor(winner('CLEAN_JOKER'), 0)).toBe(-404));

  it('T134: kazananın önceki 101 hamle cezası eklenir -> toplam 0', () => {
    expect(totalFor(winner('NORMAL', 101), 0)).toBe(0);
  });
});

describe('elden bitişte rakipler — R10', () => {
  const clean = (finishKind: FinishKind) =>
    finishedRound({
      finishKind,
      winnerSeat: 0,
      hands: { 0: [], 1: HAND_17, 2: HAND_17.map((t) => `${t}#2`), 3: ['K4'] },
      opening: { 0: 'SERIES', 1: 'UNOPENED', 2: 'UNOPENED', 3: 'UNOPENED' },
    });

  it('T117: elden bitişte açmamış rakipler 404', () => {
    const scores = scoreRound(clean('CLEAN'));
    expect(scores[1].breakdown.total).toBe(404);
    expect(scores[2].breakdown.total).toBe(404);
    expect(scores[3].breakdown.total).toBe(404);
  });

  it('T120: elden + okey bitişte açmamış rakipler 808', () => {
    const scores = scoreRound(clean('CLEAN_JOKER'));
    expect(scores[1].breakdown.total).toBe(808);
    expect(scores[1].breakdown.finishMultiplier).toBe(4);
  });
});

describe('stok bitişi — R09/R10', () => {
  it('T122/T123: kazanan yok, çarpan 1, dört oyuncu kaybeden formülüyle sayılır', () => {
    const state = finishedRound({
      finishKind: 'STOCK_EXHAUSTED',
      winnerSeat: null,
      hands: { 0: HAND_17, 1: ['K4'], 2: ['K5'], 3: ['K6'] },
      opening: { 0: 'SERIES', 1: 'UNOPENED', 2: 'SERIES', 3: 'PAIRS' },
    });
    const scores = scoreRound(state);
    expect(scores[0].breakdown.total).toBe(17);
    expect(scores[1].breakdown.total).toBe(202);
    expect(scores[2].breakdown.total).toBe(5);
    expect(scores[3].breakdown.total).toBe(12);
    expect(scores.every((s) => s.breakdown.finishMultiplier === 1)).toBe(true);
  });
});
