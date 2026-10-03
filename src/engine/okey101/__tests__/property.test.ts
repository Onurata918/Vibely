import { describe, expect, it } from 'vitest';

import { buildDeck } from '../deck';
import { validateMeld, type MeldContext } from '../meld';
import { allTileIds, createRound, type FullState } from '../state';
import { applyAction } from '../turn';
import { TOTAL_TILES, type Seat, type Tile } from '../types';
import { ids, INDICATOR_Y12, lookup } from './fixtures';

/** Deterministik, tohumlanabilir sözde-rastgele üreteç (mulberry32). */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(seed: number): Tile[] {
  const deck = buildDeck();
  const random = rng(seed);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** Kurallara uygun ama basit bir oyun: çek, rastgele bir taş at. */
function playRandomRound(seed: number, onStep?: (state: FullState) => void): FullState {
  const random = rng(seed * 7919 + 13);
  let state = createRound({ deck: shuffled(seed), starterSeat: (seed % 4) as Seat });
  onStep?.(state);

  for (let guard = 0; guard < 400 && state.status === 'ACTIVE'; guard++) {
    const seat = state.currentSeat;
    if (state.phase === 'AWAIT_DRAW') {
      const result = applyAction(state, seat, { type: 'DRAW_STOCK' });
      if (!result.ok) break;
      state = result.state;
    } else {
      const hand = state.seats[seat].hand;
      const pick = hand[Math.floor(random() * hand.length)];
      const result = applyAction(state, seat, { type: 'COMMIT_TURN', steps: [], discardTileId: pick.id });
      if (!result.ok) break;
      state = result.state;
    }
    onStep?.(state);
  }
  return state;
}

describe('P01: korunum', () => {
  it('rastgele geçerli komut dizisinde her taş tam bir bölgede kalır', () => {
    for (let seed = 1; seed <= 12; seed++) {
      playRandomRound(seed, (state) => {
        const all = allTileIds(state);
        expect(all).toHaveLength(TOTAL_TILES);
        expect(new Set(all).size).toBe(TOTAL_TILES);
      });
    }
  });

  it('eller bitene kadar oynanır ve el kazananla ya da stok bitişiyle kapanır', () => {
    const final = playRandomRound(5);
    expect(final.status).toBe('ROUND_ENDED');
    expect(final.finishKind).not.toBeNull();
  });
});

describe('P02: geçersiz planlar durumu değiştirmez', () => {
  it('reddedilen komutlar state nesnesini ve version’ı korur', () => {
    const state = createRound({ deck: shuffled(42), starterSeat: 0 });
    const before = JSON.stringify(state);

    const rejections = [
      applyAction(state, 1, { type: 'DRAW_STOCK' }), // sırası değil
      applyAction(state, 0, { type: 'DRAW_STOCK' }), // 22 taşla çekilemez
      applyAction(state, 0, { type: 'COMMIT_TURN', steps: [], discardTileId: 'yok' }),
      applyAction(state, 0, { type: 'PLAY_STEPS', steps: [{ type: 'EXTEND', meldId: 'yok', tiles: [], assignments: [] }] }),
      applyAction(state, 0, { type: 'TAKE_DISCARD_AND_PLAY', discardTileId: 'yok', steps: [] }),
    ];

    for (const result of rejections) {
      expect(result.ok).toBe(false);
      expect(result.state).toBe(state);
      expect(result.state.version).toBe(0);
    }
    expect(JSON.stringify(state)).toBe(before);
  });
});

describe('P03: determinizm', () => {
  it('aynı deste ve aynı komut dizisi daima aynı sonucu verir', () => {
    for (const seed of [3, 9, 21]) {
      expect(JSON.stringify(playRandomRound(seed))).toBe(JSON.stringify(playRandomRound(seed)));
    }
  });
});

describe('P06: giriş sırası permütasyonu', () => {
  const ctx: MeldContext = { lookup, indicator: INDICATOR_Y12 };

  it('RUN ve SET için taş sırası kabulü ve puanı değiştirmez', () => {
    const permutations = [
      ['R4', 'R5', 'R6'],
      ['R6', 'R5', 'R4'],
      ['R5', 'R4', 'R6'],
      ['R6', 'R4', 'R5'],
    ];
    for (const order of permutations) {
      const result = validateMeld({ kind: 'RUN', tiles: ids(...order), assignments: [] }, ctx);
      expect(result.valid).toBe(true);
      if (result.valid) expect(result.value).toBe(15);
    }

    const setOrders = [
      ['R8', 'B8', 'K8'],
      ['K8', 'R8', 'B8'],
      ['B8', 'K8', 'R8'],
    ];
    for (const order of setOrders) {
      const result = validateMeld({ kind: 'SET', tiles: ids(...order), assignments: [] }, ctx);
      expect(result.valid).toBe(true);
      if (result.valid) expect(result.value).toBe(24);
    }
  });
});
