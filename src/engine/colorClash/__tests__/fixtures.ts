import { buildDeck } from '../deck';
import { type RandomSource } from '../state';
import { type Card, type CardId, type Color, type Kind } from '../types';

const DECK = buildDeck();
const BY_ID = new Map(DECK.map((c) => [c.id, c]));

export const ALL_CARDS = DECK;

export function card(id: CardId): Card {
  const c = BY_ID.get(id);
  if (!c) throw new Error(`fixture card ${id} not found`);
  return c;
}

export const num = (color: Color, value: number, copy = 1): Card => card(`${color}-${value}-${copy}`);
export const action = (color: Color, kind: Kind, copy = 1): Card => card(`${color}-${kind}-${copy}`);
export const wild = (kind: 'COLOR_SHIFT' | 'CLASH_FOUR', copy = 1): Card => card(`${kind}-${copy}`);

/** Deterministik tohumlanabilir uretec (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle(seed: number): RandomSource {
  const random = rng(seed);
  return {
    shuffle: (cards) => {
      const copy = [...cards];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },
  };
}

/** Testlerde sirayi bozmayan "karistirma"; deterministik senaryolar icin. */
export const identityShuffle: RandomSource = { shuffle: (cards) => [...cards] };

/**
 * Belirli bir baslangic karti ve belirli eller icin deste kurar.
 * 4 oyuncu x 7 kart dagitildiktan sonra `start` karti ilk cevrilen olur.
 */
export function deckWith(options: { hands: Card[][]; start: Card; rest?: Card[] }): Card[] {
  const chosen = [...options.hands.flat(), options.start];
  const used = new Set(chosen.map((c) => c.id));
  const remainder = (options.rest ?? []).filter((c) => !used.has(c.id));
  for (const c of remainder) used.add(c.id);
  const filler = DECK.filter((c) => !used.has(c.id));
  return [...options.hands.flat(), options.start, ...remainder, ...filler];
}
