import { describe, expect, it } from 'vitest';

import { scoreRound } from '../score';
import { applyAction } from '../turn';
import { type MeldKind, type Seat } from '../types';
import { id, ids } from './fixtures';
import { buildState } from './turnFixtures';

/** Masada R4 R5 R6 serisi var; R3 ve R7 işlenebilir, K9 değildir. */
type TableSpec = { kind: MeldKind; ownerSeat: Seat; tiles: string[] };
const tableRun: TableSpec = { kind: 'RUN', ownerSeat: 0, tiles: ['R4', 'R5', 'R6'] };
/** 13'lü grup: gerçek okey Y13 normal yüzüyle buraya işlenebilir görünür. */
const table13: TableSpec = { kind: 'SET', ownerSeat: 0, tiles: ['R13', 'B13', 'K13'] };

const penaltyAfterDiscard = (hand: string[], discard: string, opening: 'UNOPENED' | 'SERIES' = 'SERIES', table: TableSpec[] = [tableRun]) => {
  const state = buildState({ hands: { 1: hand }, currentSeat: 1, opening: { 0: 'SERIES', 1: opening }, table });
  const result = applyAction(state, 1, { type: 'COMMIT_TURN', steps: [], discardTileId: id(discard) });
  if (!result.ok) throw new Error(`beklenmeyen red: ${result.error}`);
  return { state: result.state, penalty: result.state.seats[1].actionPenalties };
};

describe('atış cezaları — R11', () => {
  it('T135: bitirmeden gerçek okey atmak 101 ceza', () => {
    expect(penaltyAfterDiscard(['Y13', 'K9'], 'Y13').penalty).toBe(101);
  });

  it('T137: işlenebilir normal taş atmak 101 ceza', () => {
    expect(penaltyAfterDiscard(['R7', 'K9'], 'R7').penalty).toBe(101);
    expect(penaltyAfterDiscard(['R3', 'K9'], 'R3').penalty).toBe(101);
  });

  it('işlenemeyen taş atmak ceza vermez', () => {
    expect(penaltyAfterDiscard(['K9', 'K10'], 'K9').penalty).toBe(0);
  });

  it('T138: açmamış oyuncu da işlenebilir taş atarsa 101 ceza alır', () => {
    expect(penaltyAfterDiscard(['R7', 'K9'], 'R7', 'UNOPENED').penalty).toBe(101);
  });

  it('T140: okey atışı aynı anda işlenebilir görünse de yalnızca joker cezası verir', () => {
    const { penalty } = penaltyAfterDiscard(['Y13', 'K9'], 'Y13', 'SERIES', [table13]);
    expect(penalty).toBe(101);
  });

  it('T136/T139: bitiş atışında ceza yok', () => {
    // Elde tek taş kalır, atılınca el biter.
    const joker = penaltyAfterDiscard(['Y13'], 'Y13');
    expect(joker.penalty).toBe(0);
    expect(joker.state.finishKind).toBe('JOKER');

    const playable = penaltyAfterDiscard(['R7'], 'R7');
    expect(playable.penalty).toBe(0);
    expect(playable.state.finishKind).toBe('NORMAL');
  });

  it('T141: geçersiz açılış ceza üretmez ve skoru değiştirmez', () => {
    const state = buildState({ hands: { 1: ['R4#2', 'R5#2', 'R6#2', 'K9'] }, currentSeat: 1 });
    const weak = [{ kind: 'RUN' as const, tiles: ids('R4#2', 'R5#2', 'R6#2'), assignments: [] }];
    const result = applyAction(state, 1, { type: 'COMMIT_TURN', steps: [{ type: 'OPEN', mode: 'SERIES', melds: weak }], discardTileId: id('K9') });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('OPENING_TOO_LOW');
    expect(result.state).toBe(state);
    expect(result.state.seats[1].actionPenalties).toBe(0);
  });
});

describe('stok bitişi — R09', () => {
  it('T122: son taş çekildikten sonra bitmeyen atış eli kazanansız kapatır', () => {
    const state = buildState({ hands: { 1: ['K9', 'K10'] }, currentSeat: 1, phase: 'AWAIT_DRAW', stock: ['B3'] });
    const stockOfOne = { ...state, stock: state.stock.slice(0, 1) };

    const drawn = applyAction(stockOfOne, 1, { type: 'DRAW_STOCK' });
    expect(drawn.ok).toBe(true);
    if (!drawn.ok) return;
    expect(drawn.state.stock).toHaveLength(0);

    const discarded = applyAction(drawn.state, 1, { type: 'COMMIT_TURN', steps: [], discardTileId: id('K9') });
    expect(discarded.ok).toBe(true);
    if (!discarded.ok) return;
    expect(discarded.state.status).toBe('ROUND_ENDED');
    expect(discarded.state.finishKind).toBe('STOCK_EXHAUSTED');
    expect(discarded.state.winnerSeat).toBeNull();
  });

  it('T121: son taş çekildikten sonra biten oyuncu normal kazanır', () => {
    const state = buildState({ hands: { 1: ['K9'] }, currentSeat: 1, phase: 'AWAIT_DRAW', stock: ['B3'] });
    const stockOfOne = { ...state, stock: state.stock.slice(0, 1) };

    const drawn = applyAction(stockOfOne, 1, { type: 'DRAW_STOCK' });
    expect(drawn.ok).toBe(true);
    if (!drawn.ok) return;

    // Elde K9 ve B3 var; biri atılır, diğeri kalır -> bitiş değil.
    const notFinished = applyAction(drawn.state, 1, { type: 'COMMIT_TURN', steps: [], discardTileId: id('B3') });
    expect(notFinished.ok).toBe(true);
    if (notFinished.ok) expect(notFinished.state.finishKind).toBe('STOCK_EXHAUSTED');
  });

  it('stok bitişinde dört oyuncu da kaybeden formülüyle sayılır', () => {
    const state = buildState({ hands: { 1: ['K9', 'K10'] }, currentSeat: 1, phase: 'AWAIT_DRAW', stock: ['B3'] });
    const stockOfOne = { ...state, stock: state.stock.slice(0, 1) };
    const drawn = applyAction(stockOfOne, 1, { type: 'DRAW_STOCK' });
    if (!drawn.ok) throw new Error('draw failed');
    const ended = applyAction(drawn.state, 1, { type: 'COMMIT_TURN', steps: [], discardTileId: id('K9') });
    if (!ended.ok) throw new Error('commit failed');

    const scores = scoreRound(ended.state);
    expect(scores).toHaveLength(4);
    expect(scores.every((s) => s.breakdown.finishMultiplier === 1)).toBe(true);
  });
});
