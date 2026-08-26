import { CLASH_COLORS, type ClashCard } from './types';

let seq = 0;
function nextId(): string {
  seq += 1;
  return `cc${seq}-${Date.now().toString(36)}`;
}

/**
 * Standart 108 kartlik deste: her renkten 1x "0", 2x "1..9" (19 numara kartı),
 * 2x Skip/Reverse/DrawTwo (6 aksiyon kartı) = renk basina 25, 4 renk = 100.
 * + 4 Wild + 4 DrawFour = 8. Toplam 108.
 */
export function createDeck(): ClashCard[] {
  const deck: ClashCard[] = [];
  for (const color of CLASH_COLORS) {
    deck.push({ id: nextId(), kind: 'number', color, value: 0 });
    for (let v = 1; v <= 9; v++) {
      deck.push({ id: nextId(), kind: 'number', color, value: v });
      deck.push({ id: nextId(), kind: 'number', color, value: v });
    }
    for (let i = 0; i < 2; i++) {
      deck.push({ id: nextId(), kind: 'skip', color });
      deck.push({ id: nextId(), kind: 'reverse', color });
      deck.push({ id: nextId(), kind: 'drawTwo', color });
    }
  }
  for (let i = 0; i < 4; i++) {
    deck.push({ id: nextId(), kind: 'wild' });
    deck.push({ id: nextId(), kind: 'drawFour' });
  }
  return deck;
}

export function shuffleDeck<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type Deal = {
  hands: Record<string, ClashCard[]>;
  drawPile: ClashCard[];
  startingDiscard: ClashCard;
};

/**
 * Ilk acilis kartinin aksiyon karti olma durumu icin ACIK kural (doc'un
 * "do not invent behavior silently" gereksinimi):
 * - Wild: sadece renk (joker olmadan) masaya konur, ilk oyuncu (dagiticidan
 *   sonraki) rastgele/varsayilan bir renk secmez — motor bu karti tekrar
 *   desteye koyup yeni bir kart cekerek acilis kartini yeniler (en yaygin
 *   uygulanan varyant: wild/drawFour ilk kart olamaz, tekrar cekilir).
 */
export function dealCards(playerIds: string[], handSize: number): Deal {
  let deck = shuffleDeck(createDeck());
  const hands: Record<string, ClashCard[]> = {};
  for (const id of playerIds) hands[id] = [];
  for (let round = 0; round < handSize; round++) {
    for (const id of playerIds) {
      const [card, ...rest] = deck;
      hands[id] = [...hands[id], card];
      deck = rest;
    }
  }

  let startingDiscard: ClashCard;
  // Wild/DrawFour ilk acilis kartinda gelirse: desteye geri karistir, yeni kart dene.
  // (Sonsuz dongu riskine karsi guvenlik siniri.)
  let guard = 0;
  while (true) {
    guard += 1;
    const [card, ...rest] = deck;
    if (card.kind !== 'wild' && card.kind !== 'drawFour') {
      startingDiscard = card;
      deck = rest;
      break;
    }
    deck = shuffleDeck([...rest, card]);
    if (guard > 200) {
      // pratikte imkansiz ama motor asla sonsuz donmemeli
      startingDiscard = deck[0];
      deck = deck.slice(1);
      break;
    }
  }

  return { hands, drawPile: deck, startingDiscard };
}

export function drawCards(pile: ClashCard[], count: number): { drawn: ClashCard[]; rest: ClashCard[] } {
  const drawn = pile.slice(0, count);
  const rest = pile.slice(count);
  return { drawn, rest };
}

/**
 * Cekme destesi tukendiginde: en ustteki (aktif) atma karti korunur, geri
 * kalan atma yigini karistirilip yeni cekme destesi olur.
 */
export function recycleDiscardPile(discardPile: ClashCard[]): { newDrawPile: ClashCard[]; keptTopDiscard: ClashCard[] } {
  if (discardPile.length <= 1) return { newDrawPile: [], keptTopDiscard: discardPile };
  const top = discardPile[discardPile.length - 1];
  const rest = discardPile.slice(0, -1);
  // Wild/drawFour kartlarinin secilmis rengi sifirlanir (yeni turda tekrar secilecek).
  const cleaned = rest.map((c) => (c.kind === 'wild' || c.kind === 'drawFour' ? { ...c, color: undefined } : c));
  return { newDrawPile: shuffleDeck(cleaned), keptTopDiscard: [top] };
}
