import {
  COLORED_ACTIONS,
  COLORS,
  InvariantError,
  TOTAL_CARDS,
  WILD_KINDS,
  type Card,
  type CardId,
  type Color,
  type Kind,
} from './types';

/**
 * cardId bicimi okunabilirdir (`CRIMSON-7-b`, `COLOR_SHIFT-2`); motor yalnizca
 * benzersizlige guvenir, bicimi ayristirmaz.
 */
function numberId(color: Color, value: number, copy: number): CardId {
  return `${color}-${value}-${copy}`;
}

function actionId(color: Color, kind: Kind, copy: number): CardId {
  return `${color}-${kind}-${copy}`;
}

function wildId(kind: Kind, copy: number): CardId {
  return `${kind}-${copy}`;
}

/**
 * GAME_RULES "Deste ve dagitim": her renkte bir 0, 1-9'dan ikiser,
 * Block/Flip/Draw 2'den ikiser; ayrica 4 Color Shift ve 4 Clash 4. Toplam 108.
 * Sira sabittir; karistirma motorun disinda, sunucuda yapilir.
 */
export function buildDeck(): Card[] {
  const cards: Card[] = [];

  for (const color of COLORS) {
    cards.push({ id: numberId(color, 0, 1), kind: 'NUMBER', color, value: 0 });
    for (let value = 1; value <= 9; value++) {
      for (let copy = 1; copy <= 2; copy++) {
        cards.push({ id: numberId(color, value, copy), kind: 'NUMBER', color, value });
      }
    }
    for (const kind of COLORED_ACTIONS) {
      for (let copy = 1; copy <= 2; copy++) {
        cards.push({ id: actionId(color, kind, copy), kind, color, value: null });
      }
    }
  }

  for (const kind of WILD_KINDS) {
    for (let copy = 1; copy <= 4; copy++) {
      cards.push({ id: wildId(kind, copy), kind, color: null, value: null });
    }
  }

  return cards;
}

export function canonicalCardIds(): Set<CardId> {
  return new Set(buildDeck().map((c) => c.id));
}

/** Verilen destenin gercekten 108 kartin bir permutasyonu oldugunu dogrular. */
export function assertValidDeck(deck: readonly Card[]): void {
  if (deck.length !== TOTAL_CARDS) {
    throw new InvariantError(`deck must hold ${TOTAL_CARDS} cards, got ${deck.length}`);
  }

  const ids = new Set<CardId>();
  for (const card of deck) {
    if (ids.has(card.id)) throw new InvariantError(`duplicate cardId ${card.id}`);
    ids.add(card.id);
  }

  const expected = canonicalCardIds();
  for (const id of expected) {
    if (!ids.has(id)) throw new InvariantError(`deck is missing cardId ${id}`);
  }
  if (ids.size !== expected.size) throw new InvariantError('deck cardId count mismatch');
}
