import { describe, expect, it } from 'vitest';

import { assertValidDeck, buildDeck } from '../deck';
import { allCardIds, assertConservation, createRound, seatAfter } from '../state';
import { COLORS, InvariantError, STARTING_HAND_SIZE, TOTAL_CARDS, type Card, type Color, type Kind } from '../types';
import { action, deckWith, identityShuffle, num, seededShuffle, wild } from './fixtures';

const countBy = (deck: Card[], predicate: (c: Card) => boolean) => deck.filter(predicate).length;

describe('deste — C001-C004', () => {
  const deck = buildDeck();

  it('C001: 108 benzersiz cardId', () => {
    expect(deck).toHaveLength(TOTAL_CARDS);
    expect(new Set(deck.map((c) => c.id)).size).toBe(TOTAL_CARDS);
  });

  it('C002: her renkte bir 0, 1-9’dan ikişer', () => {
    for (const color of COLORS) {
      expect(countBy(deck, (c) => c.kind === 'NUMBER' && c.color === color && c.value === 0)).toBe(1);
      for (let value = 1; value <= 9; value++) {
        expect(countBy(deck, (c) => c.kind === 'NUMBER' && c.color === color && c.value === value)).toBe(2);
      }
    }
  });

  it('C003: her renkte Block/Flip/Draw 2’den ikişer', () => {
    for (const color of COLORS) {
      for (const kind of ['BLOCK', 'FLIP', 'DRAW_TWO'] as Kind[]) {
        expect(countBy(deck, (c) => c.kind === kind && c.color === color)).toBe(2);
      }
    }
  });

  it('C004: dört Color Shift ve dört Clash 4', () => {
    expect(countBy(deck, (c) => c.kind === 'COLOR_SHIFT')).toBe(4);
    expect(countBy(deck, (c) => c.kind === 'CLASH_FOUR')).toBe(4);
    expect(countBy(deck, (c) => c.color === null)).toBe(8);
  });

  it('bozuk deste reddedilir', () => {
    expect(() => assertValidDeck(deck.slice(0, 107))).toThrow(InvariantError);
    const duplicated = buildDeck();
    duplicated[5] = duplicated[0];
    expect(() => assertValidDeck(duplicated)).toThrow(InvariantError);
  });
});

describe('dağıtım — C005, C006', () => {
  it('C005: dört oyuncuya yedişer kart, kalan 80’den başlangıç atığı açılır', () => {
    const state = createRound({ deck: buildDeck(), dealerSeat: 0, random: identityShuffle });
    expect(state.seats).toHaveLength(4);
    for (const seat of state.seats) expect(seat.hand).toHaveLength(STARTING_HAND_SIZE);

    // 108 - 28 = 80; biri atik destesine cevrilir.
    expect(state.drawPile.length + state.discardPile.length).toBe(80);
    expect(state.discardPile).toHaveLength(1);
  });

  it('C006: dağıtım boyunca her kart tam bir bölgede bulunur', () => {
    for (let seed = 1; seed <= 8; seed++) {
      const random = seededShuffle(seed);
      const state = createRound({ deck: random.shuffle(buildDeck()), dealerSeat: seed % 4, random });
      expect(() => assertConservation(state)).not.toThrow();
      expect(new Set(allCardIds(state)).size).toBe(TOTAL_CARDS);
    }
  });
});

describe('başlangıç kartı etkileri — C007-C011', () => {
  const hands = () => [
    [num('CRIMSON', 1), num('CRIMSON', 2), num('CRIMSON', 3), num('CRIMSON', 4), num('CRIMSON', 5), num('CRIMSON', 6), num('CRIMSON', 7)],
    [num('AZURE', 1), num('AZURE', 2), num('AZURE', 3), num('AZURE', 4), num('AZURE', 5), num('AZURE', 6), num('AZURE', 7)],
    [num('LIME', 1), num('LIME', 2), num('LIME', 3), num('LIME', 4), num('LIME', 5), num('LIME', 6), num('LIME', 7)],
    [num('GOLD', 1), num('GOLD', 2), num('GOLD', 3), num('GOLD', 4), num('GOLD', 5), num('GOLD', 6), num('GOLD', 7)],
  ];

  const start = (first: Card, rest: Card[] = []) =>
    createRound({ deck: deckWith({ hands: hands(), start: first, rest }), dealerSeat: 0, random: identityShuffle });

  it('normal sayı kartında dealer’ın solundaki oyuncu başlar', () => {
    const state = start(num('CRIMSON', 9));
    expect(state.currentSeat).toBe(1);
    expect(state.activeColor).toBe('CRIMSON');
    expect(state.direction).toBe(1);
  });

  it('C007: ilk Clash 4 desteye karıştırılır ve yeni kart açılır', () => {
    const random = seededShuffle(99);
    const deck = deckWith({ hands: hands(), start: wild('CLASH_FOUR'), rest: [num('LIME', 8)] });
    const state = createRound({ deck, dealerSeat: 0, random });

    expect(state.discardPile[0].kind).not.toBe('CLASH_FOUR');
    // Clash 4 kaybolmaz; desteye geri karışır.
    expect(allCardIds(state)).toContain(wild('CLASH_FOUR').id);
    expect(() => assertConservation(state)).not.toThrow();
  });

  it('C008: ilk Block ilk oyuncuyu atlar', () => {
    const state = start(action('CRIMSON', 'BLOCK'));
    expect(state.currentSeat).toBe(2);
  });

  it('C009: ilk Draw 2 ilk oyuncuya iki çektirip atlar', () => {
    const state = start(action('CRIMSON', 'DRAW_TWO'));
    expect(state.seats[1].hand).toHaveLength(STARTING_HAND_SIZE + 2);
    expect(state.currentSeat).toBe(2);
    expect(() => assertConservation(state)).not.toThrow();
  });

  it('C010: ilk Flip yönü ters çevirir', () => {
    const state = start(action('CRIMSON', 'FLIP'));
    expect(state.direction).toBe(-1);
    // Yeni yöndeki ilk oyuncu: dealer'ın sağındaki seat.
    expect(state.currentSeat).toBe(seatAfter(0, -1, 4));
  });

  it('C011: ilk Color Shift başlangıç oyuncusundan renk seçimi bekler', () => {
    const state = start(wild('COLOR_SHIFT'));
    expect(state.pendingStartColorSeat).toBe(1);
    expect(state.currentSeat).toBe(1);
  });
});
