import { describe, expect, it } from 'vitest';
import { createDeck, dealCards, recycleDiscardPile, shuffleDeck } from '../deck';

describe('deste kompozisyonu', () => {
  it('108 kart icerir', () => {
    expect(createDeck().length).toBe(108);
  });

  it('her renkten 19 sayi karti (1x0, 2x1-9) + 6 aksiyon karti = 25, x4 renk = 100 + 8 wild', () => {
    const deck = createDeck();
    const numbered = deck.filter((c) => c.kind === 'number');
    const actions = deck.filter((c) => c.kind === 'skip' || c.kind === 'reverse' || c.kind === 'drawTwo');
    const wilds = deck.filter((c) => c.kind === 'wild' || c.kind === 'drawFour');
    expect(numbered.length).toBe(4 * 19);
    expect(actions.length).toBe(4 * 6);
    expect(wilds.length).toBe(8);
  });

  it('ayni renk/sayidaki iki kopya farkli fiziksel kimlige (id) sahiptir', () => {
    const deck = createDeck();
    const ids = new Set(deck.map((c) => c.id));
    expect(ids.size).toBe(deck.length);
  });

  it('karistirma tum kartlari korur (kaybolan/coğalan yok)', () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    expect(shuffled.length).toBe(deck.length);
    expect(new Set(shuffled.map((c) => c.id))).toEqual(new Set(deck.map((c) => c.id)));
  });
});

describe('dagitim', () => {
  it('her oyuncu tam olarak startingHandSize kart alir', () => {
    const deal = dealCards(['p1', 'p2', 'p3', 'p4'], 7);
    for (const id of ['p1', 'p2', 'p3', 'p4']) expect(deal.hands[id].length).toBe(7);
  });

  it('acilis atma karti asla wild/drawFour degildir', () => {
    for (let i = 0; i < 20; i++) {
      const deal = dealCards(['p1', 'p2'], 7);
      expect(deal.startingDiscard.kind).not.toBe('wild');
      expect(deal.startingDiscard.kind).not.toBe('drawFour');
    }
  });

  it('dagitilan + kalan deste + acilis karti = 108', () => {
    const ids = ['p1', 'p2', 'p3'];
    const deal = dealCards(ids, 7);
    const total = ids.reduce((sum, id) => sum + deal.hands[id].length, 0) + deal.drawPile.length + 1;
    expect(total).toBe(108);
  });
});

describe('recycleDiscardPile', () => {
  it('en ustteki atma karti korunur, geri kalani karistirilip yeni cekme destesi olur', () => {
    const deck = createDeck().slice(0, 10);
    const { newDrawPile, keptTopDiscard } = recycleDiscardPile(deck);
    expect(keptTopDiscard.length).toBe(1);
    expect(keptTopDiscard[0].id).toBe(deck[deck.length - 1].id);
    expect(newDrawPile.length).toBe(9);
  });

  it('atma yiginda tek kart varsa hicbir sey degismez', () => {
    const deck = createDeck().slice(0, 1);
    const { newDrawPile, keptTopDiscard } = recycleDiscardPile(deck);
    expect(newDrawPile.length).toBe(0);
    expect(keptTopDiscard).toEqual(deck);
  });
});
