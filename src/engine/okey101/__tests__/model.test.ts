import { describe, expect, it } from 'vitest';

import { assertValidDeck, buildDeck, falseJokerId, numberTileId } from '../deck';
import { deal, nextStarterSeat } from '../deal';
import { effectiveFace, isRealJoker, jokerFaceOf } from '../tiles';
import {
  FALSE_JOKER_COUNT,
  HAND_SIZE,
  InvariantError,
  NUMBER_TILE_COUNT,
  STARTER_HAND_SIZE,
  STOCK_SIZE,
  TILES_PER_FACE,
  TOTAL_TILES,
  type Face,
  type Seat,
  type Tile,
} from '../types';

/** Testler icin deterministik, rastgele olmayan "karistirma". */
function rotate(deck: Tile[], by: number): Tile[] {
  const k = ((by % deck.length) + deck.length) % deck.length;
  return [...deck.slice(k), ...deck.slice(0, k)];
}

function tileById(deck: Tile[], id: string): Tile {
  const t = deck.find((x) => x.id === id);
  if (!t) throw new Error(`fixture tile ${id} not found`);
  return t;
}

const RED6: Face = { color: 'RED', value: 6 };
const BLUE13: Face = { color: 'BLUE', value: 13 };

describe('deste — R01', () => {
  it('T001: yeni deste tam 106 benzersiz tileId', () => {
    const deck = buildDeck();
    expect(deck).toHaveLength(TOTAL_TILES);
    expect(new Set(deck.map((t) => t.id)).size).toBe(TOTAL_TILES);
  });

  it('T002: 52 yüzün her birinden tam iki fiziksel kopya', () => {
    const counts = new Map<string, number>();
    for (const tile of buildDeck()) {
      if (tile.kind !== 'NUMBER') continue;
      const key = `${tile.face.color}${tile.face.value}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    expect(counts.size).toBe(NUMBER_TILE_COUNT / TILES_PER_FACE);
    expect([...counts.values()].every((c) => c === TILES_PER_FACE)).toBe(true);
  });

  it('T003: tam iki ayrı sahte okey tileId', () => {
    const jokers = buildDeck().filter((t) => t.kind === 'FALSE_JOKER');
    expect(jokers).toHaveLength(FALSE_JOKER_COUNT);
    expect(new Set(jokers.map((t) => t.id)).size).toBe(FALSE_JOKER_COUNT);
  });

  it('T012: bozuk 106 taş girdisi dağıtımı başlatmaz', () => {
    const short = buildDeck().slice(0, TOTAL_TILES - 1);
    expect(() => assertValidDeck(short)).toThrow(InvariantError);

    const duplicated = buildDeck();
    duplicated[5] = duplicated[0];
    expect(() => assertValidDeck(duplicated)).toThrow(InvariantError);

    const wrongFace = buildDeck();
    wrongFace[0] = { id: 'R1#1', kind: 'NUMBER', face: { color: 'RED', value: 2 }, copy: 1 };
    expect(() => assertValidDeck(wrongFace)).toThrow(InvariantError);

    expect(() => deal(short, 0)).toThrow(InvariantError);
  });
});

describe('gösterge ve gerçek/sahte okey — R02', () => {
  it('T005: R6 gösterge -> iki R7 gerçek joker; sahte okeyin efektif yüzü R7', () => {
    expect(jokerFaceOf(RED6)).toEqual({ color: 'RED', value: 7 });

    const deck = buildDeck();
    const realJokers = deck.filter((t) => isRealJoker(t, RED6));
    expect(realJokers.map((t) => t.id).sort()).toEqual([numberTileId('RED', 7, 1), numberTileId('RED', 7, 2)].sort());

    const falseJoker = tileById(deck, falseJokerId(1));
    expect(effectiveFace(falseJoker, RED6)).toEqual({ color: 'RED', value: 7 });
    // Sahte okey normal yüzlü taştır; gerçek joker değildir.
    expect(isRealJoker(falseJoker, RED6)).toBe(false);
  });

  it('T006: B13 gösterge -> B1 gerçek joker', () => {
    expect(jokerFaceOf(BLUE13)).toEqual({ color: 'BLUE', value: 1 });
    const realJokers = buildDeck().filter((t) => isRealJoker(t, BLUE13));
    expect(realJokers.map((t) => t.id).sort()).toEqual([numberTileId('BLUE', 1, 1), numberTileId('BLUE', 1, 2)].sort());
  });

  it('T007: R6 göstergede K7 normal taştır, joker değil', () => {
    const black7 = tileById(buildDeck(), numberTileId('BLACK', 7, 1));
    expect(isRealJoker(black7, RED6)).toBe(false);
    expect(effectiveFace(black7, RED6)).toEqual({ color: 'BLACK', value: 7 });
  });
});

describe('dağıtım — R03', () => {
  it('T008: başlayan 22, diğerleri 21; gösterge 1, stok 20', () => {
    for (const starter of [0, 1, 2, 3] as Seat[]) {
      const result = deal(rotate(buildDeck(), starter * 7), starter);
      result.hands.forEach((hand, seat) => {
        expect(hand).toHaveLength(seat === starter ? STARTER_HAND_SIZE : HAND_SIZE);
      });
      expect(result.stock).toHaveLength(STOCK_SIZE);
      expect(result.indicator).toBeDefined();
      const dealt = result.hands.reduce((n, h) => n + h.length, 0);
      expect(dealt + 1 + result.stock.length).toBe(TOTAL_TILES);
    }
  });

  it('T004: gösterge olarak sahte okey seçilmez', () => {
    // Sahte okeyleri kalan 21 taşın en başına taşıyarak en zor durumu kurarız.
    const deck = buildDeck();
    const falseJokers = deck.filter((t) => t.kind === 'FALSE_JOKER');
    const rest = deck.filter((t) => t.kind !== 'FALSE_JOKER');
    const crafted = [...rest.slice(0, 85), ...falseJokers, ...rest.slice(85)];

    const result = deal(crafted, 0);
    expect(result.indicator.kind).toBe('NUMBER');
    // Seçilmeyen sahte okeyler stokta kalır, kaybolmaz.
    expect(result.stock.filter((t) => t.kind === 'FALSE_JOKER')).toHaveLength(FALSE_JOKER_COUNT);
  });

  it('T009: bölgelerin tileId birleşimi 106, kesişimler boş', () => {
    const result = deal(rotate(buildDeck(), 31), 2);
    const regions = [...result.hands.map((h) => h.map((t) => t.id)), [result.indicator.id], result.stock.map((t) => t.id)];
    const all = regions.flat();
    expect(all).toHaveLength(TOTAL_TILES);
    expect(new Set(all).size).toBe(TOTAL_TILES);

    for (let i = 0; i < regions.length; i++) {
      for (let j = i + 1; j < regions.length; j++) {
        const overlap = regions[i].filter((id) => regions[j].includes(id));
        expect(overlap).toEqual([]);
      }
    }
  });

  it('T010: aynı deste ve aynı başlangıç -> birebir aynı sonuç', () => {
    const deck = rotate(buildDeck(), 17);
    expect(deal(deck, 1)).toEqual(deal(deck, 1));
    // Farklı başlangıç seat'i farklı dağıtım verir; determinizm sabitlik demek değildir.
    expect(deal(deck, 1)).not.toEqual(deal(deck, 2));
  });

  it('T011: sonraki elde başlangıç seat bir artar, 3 sonrası 0', () => {
    expect(nextStarterSeat(0)).toBe(1);
    expect(nextStarterSeat(1)).toBe(2);
    expect(nextStarterSeat(2)).toBe(3);
    expect(nextStarterSeat(3)).toBe(0);
  });
});
